import { z } from 'zod';

// ============================================
// Auth Validation Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore and hyphen'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// DataSource Validation Schemas
// ============================================

const rssConfigSchema = z.object({
  url: z.string().url('Invalid RSS feed URL'),
  category: z.string().optional(),
});

const twitterConfigSchema = z.object({
  accounts: z.array(z.string()).min(1, 'At least one Twitter account is required'),
  keywords: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
});

const webConfigSchema = z.object({
  url: z.string().url('Invalid URL'),
  selector: z.string().min(1, 'CSS selector is required'),
  interval: z.number().optional(),
});

const newsApiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  category: z.string().optional(),
  country: z.string().optional(),
  sources: z.array(z.string()).optional(),
});

const webhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  method: z.enum(['GET', 'POST']).optional(),
  headers: z.record(z.string()).optional(),
});

export const createDataSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  type: z.enum(['rss', 'twitter', 'web', 'news_api', 'webhook'], {
    errorMap: () => ({ message: 'Invalid source type' }),
  }),
  config: z.union([
    rssConfigSchema,
    twitterConfigSchema,
    webConfigSchema,
    newsApiConfigSchema,
    webhookConfigSchema,
  ]),
  isActive: z.boolean().optional(),
  checkInterval: z.number().min(60).max(86400).optional(), // 1 minute to 24 hours
});

export const updateDataSourceSchema = createDataSourceSchema.partial();

export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;
export type UpdateDataSourceInput = z.infer<typeof updateDataSourceSchema>;

// ============================================
// NotificationRule Validation Schemas
// ============================================

const emailChannelSchema = z.object({
  enabled: z.boolean(),
  address: z.string().email().optional(),
});

const pushChannelSchema = z.object({
  enabled: z.boolean(),
  deviceIds: z.array(z.string()).optional(),
});

const webhookChannelSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url().optional(),
  secret: z.string().optional(),
});

const desktopChannelSchema = z.object({
  enabled: z.boolean(),
});

const channelsSchema = z.object({
  email: emailChannelSchema.optional(),
  push: pushChannelSchema.optional(),
  webhook: webhookChannelSchema.optional(),
  desktop: desktopChannelSchema.optional(),
});

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  timezone: z.string(),
  days: z.array(z.number().min(0).max(6)).optional(),
});

export const createNotificationRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  excludeKeywords: z.array(z.string()).optional(),
  sourceTypes: z.array(z.enum(['rss', 'twitter', 'web', 'news_api', 'webhook'])).optional(),
  priority: z.number().min(0).max(10).optional(),
  channels: channelsSchema,
  schedule: z.record(z.any()).optional(),
  quietHours: quietHoursSchema.optional(),
  batchEnabled: z.boolean().optional(),
  batchInterval: z.number().min(1).optional(),
  maxPerBatch: z.number().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateNotificationRuleSchema = createNotificationRuleSchema.partial();

export type CreateNotificationRuleInput = z.infer<typeof createNotificationRuleSchema>;
export type UpdateNotificationRuleInput = z.infer<typeof updateNotificationRuleSchema>;

// ============================================
// Job Validation Schemas
// ============================================

export const createCollectJobSchema = z.object({
  sourceId: z.string().uuid('Invalid source ID'),
  force: z.boolean().optional(), // Force collection even if recently collected
});

export type CreateCollectJobInput = z.infer<typeof createCollectJobSchema>;

// ============================================
// Pagination Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================
// Query Schemas
// ============================================

export const dataSourceQuerySchema = paginationSchema.extend({
  type: z.enum(['rss', 'twitter', 'web', 'news_api', 'webhook']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const notificationRuleQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
});

export type DataSourceQueryInput = z.infer<typeof dataSourceQuerySchema>;
export type NotificationRuleQueryInput = z.infer<typeof notificationRuleQuerySchema>;
