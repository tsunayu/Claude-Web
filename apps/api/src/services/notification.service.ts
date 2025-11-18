import { prisma } from '../lib/prisma';
import { emailNotifier, EmailConfig } from './notifications/email.notifier';
import { webhookNotifier, WebhookConfig } from './notifications/webhook.notifier';
import { webPushNotifier, WebPushConfig } from './notifications/webpush.notifier';
import { NotificationData, TemplateContext } from './template.service';

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'webpush';
  config: EmailConfig | WebhookConfig | WebPushConfig | any;
  enabled: boolean;
}

export interface SendNotificationOptions {
  userId: string;
  ruleId: string;
  collectedDataId: string;
  data: NotificationData;
  channels: NotificationChannel[];
  context?: Partial<TemplateContext>;
}

class NotificationService {
  /**
   * Send notifications through multiple channels
   */
  async send(options: SendNotificationOptions) {
    const { userId, ruleId, collectedDataId, data, channels, context } = options;

    const results: Array<{
      channel: string;
      success: boolean;
      error?: string;
    }> = [];

    // Get notification rule details for context
    const rule = await prisma.notificationRule.findUnique({
      where: { id: ruleId },
      select: { name: true, keywords: true },
    });

    const fullContext: TemplateContext = {
      data,
      timestamp: new Date().toISOString(),
      rule: rule || undefined,
      ...context,
    };

    // Send through each enabled channel
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        let result;

        switch (channel.type) {
          case 'email':
            result = await emailNotifier.send(channel.config as EmailConfig, data, fullContext);
            break;

          case 'webhook':
            result = await webhookNotifier.send(channel.config as WebhookConfig, data, fullContext);
            break;

          case 'webpush':
            result = await webPushNotifier.send(channel.config as WebPushConfig, data, fullContext);
            break;

          default:
            throw new Error(`Unsupported channel type: ${channel.type}`);
        }

        // Record success
        await this.recordNotification({
          userId,
          ruleId,
          collectedDataId,
          channel: channel.type,
          status: 'sent',
          metadata: result,
        });

        results.push({
          channel: channel.type,
          success: true,
        });

        console.log(`[NotificationService] Successfully sent ${channel.type} notification`);
      } catch (error: any) {
        // Record failure
        await this.recordNotification({
          userId,
          ruleId,
          collectedDataId,
          channel: channel.type,
          status: 'failed',
          errorMessage: error.message,
          metadata: { error: error.toString() },
        });

        results.push({
          channel: channel.type,
          success: false,
          error: error.message,
        });

        console.error(`[NotificationService] Failed to send ${channel.type} notification:`, error.message);
      }
    }

    return results;
  }

  /**
   * Record notification in history
   */
  private async recordNotification(data: {
    userId: string;
    ruleId: string;
    collectedDataId: string;
    channel: string;
    status: 'pending' | 'sent' | 'failed' | 'read';
    errorMessage?: string;
    metadata?: any;
  }) {
    return prisma.notificationHistory.create({
      data: {
        userId: data.userId,
        notificationRuleId: data.ruleId,
        collectedDataId: data.collectedDataId,
        channel: data.channel,
        status: data.status,
        sentAt: data.status === 'sent' ? new Date() : null,
        errorMessage: data.errorMessage || null,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Match collected data against notification rules and send notifications
   */
  async matchAndNotify(collectedDataId: string) {
    // Get collected data
    const collectedData = await prisma.collectedData.findUnique({
      where: { id: collectedDataId },
      include: {
        dataSource: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!collectedData) {
      console.error(`[NotificationService] Collected data not found: ${collectedDataId}`);
      return;
    }

    // Get active notification rules for the user
    const rules = await prisma.notificationRule.findMany({
      where: {
        userId: collectedData.dataSource.userId,
        isActive: true,
      },
    });

    console.log(`[NotificationService] Checking ${rules.length} rules for user ${collectedData.dataSource.userId}`);

    // Check each rule
    for (const rule of rules) {
      const matches = this.checkRuleMatch(collectedData, rule);

      if (matches) {
        console.log(`[NotificationService] Rule matched: ${rule.name}`);

        // Parse channels configuration
        const channels = this.parseChannels(rule.channels);

        if (channels.length === 0) {
          console.log(`[NotificationService] No channels configured for rule: ${rule.name}`);
          continue;
        }

        // Prepare notification data
        const notificationData: NotificationData = {
          title: collectedData.title,
          content: collectedData.content,
          summary: collectedData.summary || undefined,
          url: collectedData.url,
          author: collectedData.author || undefined,
          publishedAt: collectedData.publishedAt || undefined,
          tags: collectedData.tags,
          source: {
            name: collectedData.dataSource.name,
            type: collectedData.dataSource.type,
          },
          metadata: collectedData.metadata as any,
        };

        // Send notifications
        await this.send({
          userId: collectedData.dataSource.userId,
          ruleId: rule.id,
          collectedDataId: collectedData.id,
          data: notificationData,
          channels,
          context: {
            user: {
              username: collectedData.dataSource.user.username,
              email: collectedData.dataSource.user.email,
            },
          },
        });
      }
    }
  }

  /**
   * Check if collected data matches notification rule
   */
  private checkRuleMatch(collectedData: any, rule: any): boolean {
    // Check source type filter
    if (rule.sourceTypes && rule.sourceTypes.length > 0) {
      if (!rule.sourceTypes.includes(collectedData.dataSource.type)) {
        return false;
      }
    }

    const contentLower = `${collectedData.title} ${collectedData.content}`.toLowerCase();

    // Check keywords (must match at least one)
    if (rule.keywords && rule.keywords.length > 0) {
      const hasKeyword = rule.keywords.some((keyword: string) => contentLower.includes(keyword.toLowerCase()));
      if (!hasKeyword) {
        return false;
      }
    }

    // Check exclude keywords (must not match any)
    if (rule.excludeKeywords && rule.excludeKeywords.length > 0) {
      const hasExcludeKeyword = rule.excludeKeywords.some((keyword: string) =>
        contentLower.includes(keyword.toLowerCase())
      );
      if (hasExcludeKeyword) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse channels configuration from JSON
   */
  private parseChannels(channelsConfig: any): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    if (channelsConfig.email && channelsConfig.email.enabled) {
      channels.push({
        type: 'email',
        config: channelsConfig.email,
        enabled: true,
      });
    }

    if (channelsConfig.webhook && channelsConfig.webhook.enabled) {
      channels.push({
        type: 'webhook',
        config: channelsConfig.webhook,
        enabled: true,
      });
    }

    if (channelsConfig.webpush && channelsConfig.webpush.enabled) {
      channels.push({
        type: 'webpush',
        config: channelsConfig.webpush,
        enabled: true,
      });
    }

    return channels;
  }

  /**
   * Get notification history for a user
   */
  async getHistory(userId: string, options: { limit?: number; offset?: number; status?: string } = {}) {
    const { limit = 50, offset = 0, status } = options;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [notifications, total] = await Promise.all([
      prisma.notificationHistory.findMany({
        where,
        include: {
          collectedData: {
            select: {
              title: true,
              url: true,
            },
          },
          notificationRule: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.notificationHistory.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notificationHistory.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });
  }
}

export const notificationService = new NotificationService();
