import webpush from 'web-push';
import { prisma } from '../../lib/prisma';
import { NotificationData, TemplateContext } from '../template.service';

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushConfig {
  subscription: WebPushSubscription;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  ttl?: number; // Time to live in seconds
}

export class WebPushNotifier {
  private configured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@iah.example.com';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.configured = true;
      console.log('[WebPushNotifier] Web Push configured');
    } else {
      console.warn('[WebPushNotifier] VAPID keys not configured. Web Push notifications will not work.');
    }
  }

  async send(pushConfig: WebPushConfig, data: NotificationData, context: Partial<TemplateContext> = {}) {
    if (!this.configured) {
      throw new Error('Web Push is not configured. Please set VAPID keys.');
    }

    const payload = {
      title: this.truncate(data.title, 50),
      body: this.truncate(data.summary || data.content, 100),
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `notification-${Date.now()}`,
      data: {
        url: data.url,
        source: data.source?.name,
        ruleId: context.rule?.name,
        timestamp: new Date().toISOString(),
      },
      actions: [
        {
          action: 'open',
          title: '開く',
        },
        {
          action: 'close',
          title: '閉じる',
        },
      ],
    };

    try {
      const result = await webpush.sendNotification(
        pushConfig.subscription,
        JSON.stringify(payload),
        {
          urgency: pushConfig.urgency || 'normal',
          TTL: pushConfig.ttl || 86400, // 24 hours default
        }
      );

      console.log('[WebPushNotifier] Push notification sent successfully');

      return {
        success: true,
        statusCode: result.statusCode,
      };
    } catch (error: any) {
      console.error('[WebPushNotifier] Push notification error:', error);

      // Handle expired subscriptions
      if (error.statusCode === 410) {
        console.log('[WebPushNotifier] Subscription expired, should be removed from database');
        // You can implement cleanup logic here
      }

      throw new Error(`Failed to send push notification: ${error.message}`);
    }
  }

  /**
   * Send push notification to all user's subscriptions
   */
  async sendToUser(userId: string, data: NotificationData, context: Partial<TemplateContext> = {}) {
    // For now, we'll implement a simple version
    // In production, you'd store push subscriptions in the database
    console.log(`[WebPushNotifier] Would send push notification to user ${userId}`);

    // Placeholder for database integration
    // const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    // for (const sub of subscriptions) {
    //   await this.send({ subscription: sub.subscription }, data, context);
    // }

    return { success: true, sent: 0 };
  }

  /**
   * Generate VAPID keys (for setup)
   */
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }

  /**
   * Get public VAPID key for client
   */
  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  private truncate(text: string, length: number): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}

export const webPushNotifier = new WebPushNotifier();
