import Parser from 'rss-parser';
import { BaseCollector, CollectedContent, CollectorResult } from './base';
import { DataSource } from '@prisma/client';

interface RSSConfig {
  url: string;
  category?: string;
}

export class RSSCollector extends BaseCollector {
  private parser: Parser;
  private config: RSSConfig;

  constructor(dataSource: DataSource) {
    super(dataSource, 5); // Allow 5 concurrent RSS fetches
    this.config = dataSource.config as RSSConfig;
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IAH-Bot/1.0)',
      },
    });
  }

  async collect(): Promise<CollectorResult> {
    try {
      console.log(`[RSS] Collecting from: ${this.config.url}`);

      // Check rate limit (60 requests per hour)
      await this.checkRateLimit({
        maxRequests: 60,
        windowMs: 60 * 60 * 1000,
      });

      // Fetch and parse RSS feed with retry
      const feed = await this.retry(() => this.parser.parseURL(this.config.url));

      const items: CollectedContent[] = [];

      for (const item of feed.items) {
        if (!item.link || !item.title) {
          continue;
        }

        const content: CollectedContent = {
          title: item.title,
          content: item.contentSnippet || item.content || item.summary || '',
          summary: item.contentSnippet || this.generateSummary(item.content || ''),
          url: this.normalizeUrl(item.link),
          author: item.creator || item.author || feed.title,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          language: feed.language,
          tags: this.extractTags(item),
          categories: this.extractCategories(item, this.config.category),
          imageUrl: this.extractImage(item),
        };

        items.push(content);
      }

      console.log(`[RSS] Collected ${items.length} items from ${this.config.url}`);

      return {
        success: true,
        itemsCollected: items.length,
        items,
      };
    } catch (error) {
      console.error(`[RSS] Error collecting from ${this.config.url}:`, error);

      return {
        success: false,
        itemsCollected: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractTags(item: any): string[] {
    const tags: string[] = [];

    if (Array.isArray(item.categories)) {
      tags.push(...item.categories);
    }

    if (Array.isArray(item.tags)) {
      tags.push(...item.tags);
    }

    return [...new Set(tags)].slice(0, 10); // Unique tags, max 10
  }

  private extractCategories(item: any, defaultCategory?: string): string[] {
    const categories: string[] = [];

    if (defaultCategory) {
      categories.push(defaultCategory);
    }

    if (Array.isArray(item.categories)) {
      categories.push(...item.categories);
    }

    return [...new Set(categories)];
  }

  private extractImage(item: any): string | undefined {
    // Try various image fields
    if (item.enclosure?.url && this.isImageUrl(item.enclosure.url)) {
      return item.enclosure.url;
    }

    if (item.image?.url) {
      return item.image.url;
    }

    if (item['media:thumbnail']?.['@']?.url) {
      return item['media:thumbnail']['@'].url;
    }

    if (item['media:content']?.['@']?.url) {
      return item['media:content']['@'].url;
    }

    // Try to extract from content
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  }
}
