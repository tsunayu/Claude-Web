export interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  userId: string;
  name: string;
  type: 'rss' | 'twitter' | 'web' | 'news_api' | 'webhook';
  config: Record<string, any>;
  isActive: boolean;
  checkInterval: number;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  userId: string;
  name: string;
  keywords: string[];
  excludeKeywords: string[];
  sourceTypes: string[];
  priority: number;
  channels: Record<string, any>;
  batchEnabled: boolean;
  batchInterval: number | null;
  batchMaxCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectedData {
  id: string;
  dataSourceId: string;
  title: string;
  content: string;
  summary: string | null;
  url: string;
  author: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
  tags: string[];
  categories: string[];
  language: string | null;
  sentiment: number | null;
  keywords: string[];
  metadata: Record<string, any>;
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  notificationRuleId: string | null;
  collectedDataId: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt: string | null;
  readAt: string | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
