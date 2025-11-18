import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { BaseCollector, CollectedContent, CollectorResult } from './base';
import { DataSource } from '@prisma/client';

interface WebConfig {
  url: string;
  selector: string;
  titleSelector?: string;
  contentSelector?: string;
  authorSelector?: string;
  dateSelector?: string;
  imageSelector?: string;
  waitForSelector?: string;
  useJavaScript?: boolean; // Use Puppeteer (true) or simple HTTP fetch (false)
}

export class WebCollector extends BaseCollector {
  private config: WebConfig;
  private browser: Browser | null = null;

  constructor(dataSource: DataSource) {
    super(dataSource, 2); // Limit to 2 concurrent browser instances
    this.config = dataSource.config as WebConfig;
  }

  async collect(): Promise<CollectorResult> {
    try {
      console.log(`[Web] Collecting from: ${this.config.url}`);

      // Check rate limit (30 requests per hour for web scraping)
      await this.checkRateLimit({
        maxRequests: 30,
        windowMs: 60 * 60 * 1000,
      });

      let html: string;

      if (this.config.useJavaScript !== false) {
        // Use Puppeteer for JavaScript-heavy sites
        html = await this.fetchWithPuppeteer();
      } else {
        // Use simple HTTP fetch for static sites
        html = await this.fetchWithHttp();
      }

      const items = await this.parseHtml(html);

      console.log(`[Web] Collected ${items.length} items from ${this.config.url}`);

      return {
        success: true,
        itemsCollected: items.length,
        items,
      };
    } catch (error) {
      console.error(`[Web] Error collecting from ${this.config.url}:`, error);

      return {
        success: false,
        itemsCollected: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.closeBrowser();
    }
  }

  private async fetchWithPuppeteer(): Promise<string> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(this.config.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for specific selector if provided
      if (this.config.waitForSelector) {
        await page.waitForSelector(this.config.waitForSelector, { timeout: 10000 });
      }

      const html = await page.content();
      return html;
    } finally {
      await page.close();
    }
  }

  private async fetchWithHttp(): Promise<string> {
    const axios = (await import('axios')).default;

    const response = await this.retry(() =>
      axios.get(this.config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IAH-Bot/1.0)',
        },
        timeout: 10000,
      })
    );

    return response.data;
  }

  private async parseHtml(html: string): Promise<CollectedContent[]> {
    const $ = cheerio.load(html);
    const items: CollectedContent[] = [];

    $(this.config.selector).each((index, element) => {
      const $el = $(element);

      const title = this.extractTitle($, $el);
      const content = this.extractContent($, $el);
      const url = this.extractUrl($, $el);

      if (!title || !url) {
        return; // Skip if missing essential fields
      }

      const item: CollectedContent = {
        title,
        content,
        summary: this.generateSummary(content),
        url: this.normalizeUrl(url, this.config.url),
        author: this.extractAuthor($, $el),
        publishedAt: this.extractDate($, $el),
        imageUrl: this.extractImageUrl($, $el),
        tags: [this.extractDomain(this.config.url)],
        categories: ['web'],
      };

      items.push(item);
    });

    return items.slice(0, 50); // Limit to 50 items per scrape
  }

  private extractTitle($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
    if (this.config.titleSelector) {
      return $el.find(this.config.titleSelector).text().trim();
    }

    // Try common title selectors
    const titleSelectors = ['h1', 'h2', 'h3', '.title', '.headline', 'a'];
    for (const selector of titleSelectors) {
      const text = $el.find(selector).first().text().trim();
      if (text) return text;
    }

    return $el.text().trim().substring(0, 200);
  }

  private extractContent($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
    if (this.config.contentSelector) {
      return this.extractText($el.find(this.config.contentSelector).html() || '');
    }

    // Try common content selectors
    const contentSelectors = ['.content', '.description', '.summary', 'p'];
    for (const selector of contentSelectors) {
      const content = $el.find(selector).html();
      if (content) return this.extractText(content);
    }

    return this.extractText($el.html() || '');
  }

  private extractUrl($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
    // Try to find link
    const link = $el.find('a').first().attr('href') || $el.attr('href');
    return link || this.config.url;
  }

  private extractAuthor($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | undefined {
    if (this.config.authorSelector) {
      return $el.find(this.config.authorSelector).text().trim() || undefined;
    }

    const authorSelectors = ['.author', '.by', '[rel="author"]'];
    for (const selector of authorSelectors) {
      const author = $el.find(selector).text().trim();
      if (author) return author;
    }

    return undefined;
  }

  private extractDate($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): Date | undefined {
    if (this.config.dateSelector) {
      const dateStr = $el.find(this.config.dateSelector).text().trim();
      return this.parseDate(dateStr);
    }

    const dateSelectors = ['time', '.date', '.published', '[datetime]'];
    for (const selector of dateSelectors) {
      const $date = $el.find(selector);
      const dateStr = $date.attr('datetime') || $date.text().trim();
      const date = this.parseDate(dateStr);
      if (date) return date;
    }

    return undefined;
  }

  private extractImageUrl($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | undefined {
    if (this.config.imageSelector) {
      const img = $el.find(this.config.imageSelector).first();
      return img.attr('src') || img.attr('data-src') || undefined;
    }

    const img = $el.find('img').first();
    const imgUrl = img.attr('src') || img.attr('data-src');

    if (imgUrl) {
      return this.normalizeUrl(imgUrl, this.config.url);
    }

    return undefined;
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
