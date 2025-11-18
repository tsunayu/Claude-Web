import { TwitterApi } from 'twitter-api-v2';
import { BaseCollector, CollectedContent, CollectorResult } from './base';
import { DataSource } from '@prisma/client';

interface TwitterConfig {
  accounts: string[];
  keywords?: string[];
  hashtags?: string[];
  bearerToken?: string;
}

export class TwitterCollector extends BaseCollector {
  private config: TwitterConfig;
  private client: TwitterApi | null = null;

  constructor(dataSource: DataSource) {
    super(dataSource, 1); // Sequential processing for Twitter API
    this.config = dataSource.config as TwitterConfig;

    if (this.config.bearerToken) {
      this.client = new TwitterApi(this.config.bearerToken);
    }
  }

  async collect(): Promise<CollectorResult> {
    try {
      if (!this.client) {
        throw new Error('Twitter API bearer token not configured');
      }

      console.log(`[Twitter] Collecting from accounts: ${this.config.accounts.join(', ')}`);

      // Check rate limit (15 requests per 15 minutes for user timeline)
      await this.checkRateLimit({
        maxRequests: 15,
        windowMs: 15 * 60 * 1000,
      });

      const items: CollectedContent[] = [];

      // Collect from each account
      for (const account of this.config.accounts) {
        const accountItems = await this.collectFromAccount(account);
        items.push(...accountItems);

        // Rate limiting between accounts
        await this.sleep(1000);
      }

      // If keywords/hashtags are specified, search for them
      if (this.config.keywords || this.config.hashtags) {
        const searchItems = await this.collectFromSearch();
        items.push(...searchItems);
      }

      // Deduplicate by URL
      const uniqueItems = this.deduplicateItems(items);

      console.log(`[Twitter] Collected ${uniqueItems.length} tweets`);

      return {
        success: true,
        itemsCollected: uniqueItems.length,
        items: uniqueItems,
      };
    } catch (error) {
      console.error(`[Twitter] Error collecting:`, error);

      return {
        success: false,
        itemsCollected: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async collectFromAccount(username: string): Promise<CollectedContent[]> {
    if (!this.client) return [];

    try {
      // Remove @ if present
      const cleanUsername = username.replace('@', '');

      // Get user
      const user = await this.client.v2.userByUsername(cleanUsername);

      if (!user.data) {
        console.warn(`[Twitter] User not found: ${cleanUsername}`);
        return [];
      }

      // Get user timeline
      const timeline = await this.client.v2.userTimeline(user.data.id, {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
        expansions: ['attachments.media_keys'],
        'media.fields': ['url', 'preview_image_url'],
      });

      const items: CollectedContent[] = [];

      for (const tweet of timeline.tweets) {
        const tweetUrl = `https://twitter.com/${cleanUsername}/status/${tweet.id}`;

        const item: CollectedContent = {
          title: `Tweet from @${cleanUsername}`,
          content: tweet.text,
          summary: this.generateSummary(tweet.text, 150),
          url: tweetUrl,
          author: `@${cleanUsername}`,
          publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
          tags: this.extractHashtags(tweet.text),
          categories: ['twitter', 'social'],
        };

        items.push(item);
      }

      return items;
    } catch (error) {
      console.error(`[Twitter] Error collecting from @${username}:`, error);
      return [];
    }
  }

  private async collectFromSearch(): Promise<CollectedContent[]> {
    if (!this.client) return [];

    try {
      const searchQuery = this.buildSearchQuery();
      if (!searchQuery) return [];

      const searchResults = await this.client.v2.search(searchQuery, {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      });

      const items: CollectedContent[] = [];

      for (const tweet of searchResults.tweets) {
        const author = searchResults.includes?.users?.find((u) => u.id === tweet.author_id);
        const username = author?.username || 'unknown';
        const tweetUrl = `https://twitter.com/${username}/status/${tweet.id}`;

        const item: CollectedContent = {
          title: `Tweet from @${username}`,
          content: tweet.text,
          summary: this.generateSummary(tweet.text, 150),
          url: tweetUrl,
          author: `@${username}`,
          publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
          tags: this.extractHashtags(tweet.text),
          categories: ['twitter', 'social'],
        };

        items.push(item);
      }

      return items;
    } catch (error) {
      console.error(`[Twitter] Error searching:`, error);
      return [];
    }
  }

  private buildSearchQuery(): string {
    const parts: string[] = [];

    if (this.config.keywords && this.config.keywords.length > 0) {
      parts.push(this.config.keywords.join(' OR '));
    }

    if (this.config.hashtags && this.config.hashtags.length > 0) {
      const hashtags = this.config.hashtags.map((tag) =>
        tag.startsWith('#') ? tag : `#${tag}`
      );
      parts.push(hashtags.join(' OR '));
    }

    return parts.join(' OR ');
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }

    return hashtags;
  }

  private deduplicateItems(items: CollectedContent[]): CollectedContent[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
  }
}
