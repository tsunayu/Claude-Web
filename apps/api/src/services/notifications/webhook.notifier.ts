import axios from 'axios';
import { templateService, NotificationData, TemplateContext } from '../template.service';

export interface WebhookConfig {
  url: string;
  type: 'slack' | 'discord' | 'generic';
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT';
  customPayload?: string; // Custom Handlebars template
}

export class WebhookNotifier {
  async send(webhookConfig: WebhookConfig, data: NotificationData, context: Partial<TemplateContext> = {}) {
    const fullContext: TemplateContext = {
      data,
      timestamp: new Date().toISOString(),
      ...context,
    };

    let payload: any;

    if (webhookConfig.customPayload) {
      // Use custom template
      const customTemplate = webhookConfig.customPayload;
      payload = JSON.parse(templateService.render('webhook', fullContext));
    } else {
      // Use default templates based on type
      switch (webhookConfig.type) {
        case 'slack':
          payload = this.buildSlackPayload(data, fullContext);
          break;
        case 'discord':
          payload = this.buildDiscordPayload(data, fullContext);
          break;
        case 'generic':
          payload = this.buildGenericPayload(data, fullContext);
          break;
        default:
          throw new Error(`Unsupported webhook type: ${webhookConfig.type}`);
      }
    }

    try {
      const response = await axios({
        method: webhookConfig.method || 'POST',
        url: webhookConfig.url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers,
        },
        timeout: 10000,
      });

      console.log(`[WebhookNotifier] Webhook sent to ${webhookConfig.type}: ${webhookConfig.url}`);

      return {
        success: true,
        status: response.status,
        type: webhookConfig.type,
      };
    } catch (error: any) {
      console.error(`[WebhookNotifier] Webhook error:`, error.response?.data || error.message);
      throw new Error(`Failed to send webhook: ${error.message}`);
    }
  }

  private buildSlackPayload(data: NotificationData, context: TemplateContext): any {
    const fields: any[] = [];

    if (data.author) {
      fields.push({
        title: '著者',
        value: data.author,
        short: true,
      });
    }

    if (data.source) {
      fields.push({
        title: 'ソース',
        value: data.source.name,
        short: true,
      });
    }

    if (data.publishedAt) {
      fields.push({
        title: '公開日',
        value: new Date(data.publishedAt).toLocaleDateString('ja-JP'),
        short: true,
      });
    }

    if (data.tags && data.tags.length > 0) {
      fields.push({
        title: 'タグ',
        value: data.tags.join(', '),
        short: false,
      });
    }

    return {
      username: 'Intelligent Alert Hub',
      icon_emoji: ':bell:',
      attachments: [
        {
          color: '#667eea',
          title: data.title,
          title_link: data.url,
          text: data.summary || data.content.substring(0, 200),
          fields,
          footer: context.rule?.name || 'IAH Notification',
          ts: data.publishedAt ? Math.floor(new Date(data.publishedAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  private buildDiscordPayload(data: NotificationData, context: TemplateContext): any {
    const fields: any[] = [];

    if (data.author) {
      fields.push({
        name: '著者',
        value: data.author,
        inline: true,
      });
    }

    if (data.source) {
      fields.push({
        name: 'ソース',
        value: data.source.name,
        inline: true,
      });
    }

    if (data.tags && data.tags.length > 0) {
      fields.push({
        name: 'タグ',
        value: data.tags.join(', '),
        inline: false,
      });
    }

    return {
      username: 'Intelligent Alert Hub',
      avatar_url: 'https://example.com/icon.png', // Replace with actual icon URL
      embeds: [
        {
          title: data.title,
          url: data.url,
          description: data.summary || data.content.substring(0, 200),
          color: 6718186, // #667eea in decimal
          fields,
          footer: {
            text: context.rule?.name || 'IAH Notification',
          },
          timestamp: data.publishedAt ? new Date(data.publishedAt).toISOString() : new Date().toISOString(),
        },
      ],
    };
  }

  private buildGenericPayload(data: NotificationData, context: TemplateContext): any {
    return {
      title: data.title,
      content: data.content,
      summary: data.summary,
      url: data.url,
      author: data.author,
      publishedAt: data.publishedAt,
      tags: data.tags,
      source: data.source,
      metadata: data.metadata,
      rule: context.rule,
      timestamp: context.timestamp,
    };
  }

  /**
   * Verify webhook configuration by sending a test message
   */
  async verify(webhookConfig: WebhookConfig): Promise<boolean> {
    try {
      const testData: NotificationData = {
        title: 'IAH Webhook Test',
        content: 'This is a test notification from Intelligent Alert Hub.',
        summary: 'Test notification',
        url: 'https://example.com',
        tags: ['test'],
      };

      await this.send(webhookConfig, testData);
      return true;
    } catch (error) {
      console.error('[WebhookNotifier] Verification failed:', error);
      return false;
    }
  }
}

export const webhookNotifier = new WebhookNotifier();
