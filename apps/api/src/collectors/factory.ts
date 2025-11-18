import { DataSource } from '@prisma/client';
import { BaseCollector } from './base';
import { RSSCollector } from './rss.collector';
import { WebCollector } from './web.collector';
import { TwitterCollector } from './twitter.collector';
import { NewsAPICollector } from './newsapi.collector';

export class CollectorFactory {
  /**
   * Creates the appropriate collector instance based on the data source type
   * @param dataSource The data source configuration
   * @returns An instance of the appropriate collector
   * @throws Error if the data source type is not supported
   */
  static create(dataSource: DataSource): BaseCollector {
    switch (dataSource.type) {
      case 'rss':
        return new RSSCollector(dataSource);

      case 'web':
        return new WebCollector(dataSource);

      case 'twitter':
        return new TwitterCollector(dataSource);

      case 'news_api':
        return new NewsAPICollector(dataSource);

      case 'webhook':
        // Webhook is passive (receives data via POST), not an active collector
        throw new Error('Webhook data sources do not support active collection');

      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  /**
   * Validates that a data source configuration is valid for its type
   * @param dataSource The data source to validate
   * @returns True if valid
   * @throws Error with detailed message if invalid
   */
  static validate(dataSource: DataSource): boolean {
    const config = dataSource.config as any;

    switch (dataSource.type) {
      case 'rss':
        if (!config.url) {
          throw new Error('RSS data source requires a URL in config');
        }
        break;

      case 'web':
        if (!config.url) {
          throw new Error('Web scraper requires a URL in config');
        }
        if (!config.selectors) {
          throw new Error('Web scraper requires selectors in config');
        }
        break;

      case 'twitter':
        if (!config.accounts || !Array.isArray(config.accounts) || config.accounts.length === 0) {
          throw new Error('Twitter collector requires at least one account in config');
        }
        if (!config.bearerToken) {
          throw new Error('Twitter collector requires a bearerToken in config');
        }
        break;

      case 'news_api':
        if (!config.apiKey) {
          throw new Error('NewsAPI collector requires an apiKey in config');
        }
        break;

      case 'webhook':
        // Webhook validation happens at the webhook endpoint level
        break;

      default:
        throw new Error(`Unknown data source type: ${dataSource.type}`);
    }

    return true;
  }
}
