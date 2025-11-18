import axios from 'axios';
import { BaseCollector, CollectedContent, CollectorResult } from './base';
import { DataSource } from '@prisma/client';

interface NewsAPIConfig {
  apiKey: string;
  category?: string;
  country?: string;
  sources?: string[];
  keywords?: string[];
}

interface NewsAPIArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export class NewsAPICollector extends BaseCollector {
  private config: NewsAPIConfig;
  private baseUrl = 'https://newsapi.org/v2';

  constructor(dataSource: DataSource) {
    super(dataSource, 1); // Sequential processing for News API
    this.config = dataSource.config as NewsAPIConfig;
  }

  async collect(): Promise<CollectorResult> {
    try {
      console.log(`[NewsAPI] Collecting articles`);

      // Check rate limit (100 requests per day for free tier)
      await this.checkRateLimit({
        maxRequests: 100,
        windowMs: 24 * 60 * 60 * 1000,
      });

      let articles: NewsAPIArticle[] = [];

      // Use top-headlines endpoint if category or country is specified
      if (this.config.category || this.config.country) {
        articles = await this.fetchTopHeadlines();
      } else {
        // Use everything endpoint for keyword search
        articles = await this.fetchEverything();
      }

      const items: CollectedContent[] = articles.map((article) => ({
        title: article.title,
        content: article.content || article.description || '',
        summary: article.description || this.generateSummary(article.content || ''),
        url: article.url,
        author: article.author || article.source.name,
        publishedAt: new Date(article.publishedAt),
        imageUrl: article.urlToImage || undefined,
        tags: this.extractTags(article),
        categories: this.config.category ? [this.config.category] : ['news'],
        language: this.config.country ? this.getLanguageFromCountry(this.config.country) : undefined,
      }));

      console.log(`[NewsAPI] Collected ${items.length} articles`);

      return {
        success: true,
        itemsCollected: items.length,
        items,
      };
    } catch (error) {
      console.error(`[NewsAPI] Error collecting:`, error);

      return {
        success: false,
        itemsCollected: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetchTopHeadlines(): Promise<NewsAPIArticle[]> {
    const params: any = {
      apiKey: this.config.apiKey,
      pageSize: 20,
    };

    if (this.config.category) {
      params.category = this.config.category;
    }

    if (this.config.country) {
      params.country = this.config.country;
    }

    if (this.config.sources && this.config.sources.length > 0) {
      params.sources = this.config.sources.join(',');
      // Note: Can't use country/category with sources
      delete params.country;
      delete params.category;
    }

    const response = await this.retry(() =>
      axios.get(`${this.baseUrl}/top-headlines`, { params })
    );

    return response.data.articles || [];
  }

  private async fetchEverything(): Promise<NewsAPIArticle[]> {
    const params: any = {
      apiKey: this.config.apiKey,
      pageSize: 20,
      sortBy: 'publishedAt',
    };

    if (this.config.keywords && this.config.keywords.length > 0) {
      params.q = this.config.keywords.join(' OR ');
    }

    if (this.config.sources && this.config.sources.length > 0) {
      params.sources = this.config.sources.join(',');
    }

    // Default to last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    params.from = yesterday.toISOString();

    const response = await this.retry(() =>
      axios.get(`${this.baseUrl}/everything`, { params })
    );

    return response.data.articles || [];
  }

  private extractTags(article: NewsAPIArticle): string[] {
    const tags: string[] = [];

    // Add source name as tag
    if (article.source.name) {
      tags.push(article.source.name);
    }

    // Extract potential tags from title
    const words = article.title.split(' ');
    const capitalizedWords = words.filter(
      (word) =>
        word.length > 3 &&
        word[0] === word[0].toUpperCase() &&
        !['This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which'].includes(word)
    );
    tags.push(...capitalizedWords);

    return [...new Set(tags)].slice(0, 10);
  }

  private getLanguageFromCountry(country: string): string {
    const countryLanguageMap: Record<string, string> = {
      us: 'en',
      gb: 'en',
      ca: 'en',
      au: 'en',
      de: 'de',
      fr: 'fr',
      it: 'it',
      es: 'es',
      jp: 'ja',
      cn: 'zh',
      kr: 'ko',
      ru: 'ru',
    };

    return countryLanguageMap[country.toLowerCase()] || 'en';
  }
}
