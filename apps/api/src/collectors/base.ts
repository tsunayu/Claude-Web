import { DataSource } from '@prisma/client';
import pLimit from 'p-limit';

// Collected content interface
export interface CollectedContent {
  title: string;
  content: string;
  summary?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  language?: string;
  tags?: string[];
  categories?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

// Collector result interface
export interface CollectorResult {
  success: boolean;
  itemsCollected: number;
  items: CollectedContent[];
  error?: string;
}

// Rate limiter configuration
export interface RateLimiterConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
}

// Base collector class
export abstract class BaseCollector {
  protected dataSource: DataSource;
  protected rateLimiter: pLimit.Limit;
  protected requestLog: number[] = [];

  constructor(dataSource: DataSource, concurrency: number = 1) {
    this.dataSource = dataSource;
    this.rateLimiter = pLimit(concurrency);
  }

  /**
   * Main collect method - to be implemented by subclasses
   */
  abstract collect(): Promise<CollectorResult>;

  /**
   * Rate limiting check
   */
  protected async checkRateLimit(config: RateLimiterConfig): Promise<void> {
    const now = Date.now();

    // Remove old timestamps outside the window
    this.requestLog = this.requestLog.filter((timestamp) => now - timestamp < config.windowMs);

    // Check if we're at the limit
    if (this.requestLog.length >= config.maxRequests) {
      const oldestRequest = this.requestLog[0];
      const waitTime = config.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await this.sleep(waitTime);
        // Retry after waiting
        return this.checkRateLimit(config);
      }
    }

    // Log this request
    this.requestLog.push(now);
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract text from HTML
   */
  protected extractText(html: string, maxLength: number = 10000): string {
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, maxLength);
  }

  /**
   * Generate summary from content
   */
  protected generateSummary(content: string, maxLength: number = 200): string {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let summary = '';

    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) {
        break;
      }
      summary += sentence.trim() + '. ';
    }

    return summary.trim() || content.substring(0, maxLength) + '...';
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Validate URL
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean and normalize URL
   */
  protected normalizeUrl(url: string, baseUrl?: string): string {
    try {
      if (baseUrl && !url.startsWith('http')) {
        return new URL(url, baseUrl).toString();
      }
      return new URL(url).toString();
    } catch {
      return url;
    }
  }

  /**
   * Extract domain from URL
   */
  protected extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}
