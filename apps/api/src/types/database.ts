// Database model types and enums

export const SubscriptionTier = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTierType = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const DataSourceType = {
  RSS: 'rss',
  TWITTER: 'twitter',
  WEB: 'web',
  NEWS_API: 'news_api',
  WEBHOOK: 'webhook',
} as const;

export type DataSourceTypeType = (typeof DataSourceType)[keyof typeof DataSourceType];

export const NotificationChannel = {
  EMAIL: 'email',
  PUSH: 'push',
  WEBHOOK: 'webhook',
  DESKTOP: 'desktop',
} as const;

export type NotificationChannelType = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read',
} as const;

export type NotificationStatusType = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// Data Source Config Types
export interface RSSConfig {
  url: string;
  category?: string;
}

export interface TwitterConfig {
  accounts: string[];
  keywords?: string[];
  hashtags?: string[];
}

export interface WebConfig {
  url: string;
  selector: string;
  interval?: number;
}

export interface NewsAPIConfig {
  apiKey: string;
  category?: string;
  country?: string;
  sources?: string[];
}

export interface WebhookConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
}

export type DataSourceConfig = RSSConfig | TwitterConfig | WebConfig | NewsAPIConfig | WebhookConfig;

// Notification Channel Config Types
export interface EmailChannelConfig {
  enabled: boolean;
  address: string;
}

export interface PushChannelConfig {
  enabled: boolean;
  deviceIds?: string[];
}

export interface WebhookChannelConfig {
  enabled: boolean;
  url: string;
  secret?: string;
}

export interface DesktopChannelConfig {
  enabled: boolean;
}

export interface NotificationChannels {
  email?: EmailChannelConfig;
  push?: PushChannelConfig;
  webhook?: WebhookChannelConfig;
  desktop?: DesktopChannelConfig;
}

// Schedule Types
export interface NotificationSchedule {
  type: 'instant' | 'batch' | 'digest';
  batchInterval?: number; // in minutes
  digestTime?: string; // "09:00"
}

export interface QuietHours {
  enabled: boolean;
  start: string; // "22:00"
  end: string; // "07:00"
  timezone: string;
  days?: number[]; // [0-6] 0=Sunday
}

// API Key Permissions
export interface ApiKeyPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin?: boolean;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
