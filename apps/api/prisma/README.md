# Database Schema Documentation

This document describes the database schema for the Intelligent Alert Hub (IAH) application.

## Overview

The database uses PostgreSQL with Prisma ORM for type-safe database access. The schema consists of 6 main models:

1. **User** - User accounts and authentication
2. **DataSource** - Information source configurations
3. **NotificationRule** - Notification rules and filters
4. **CollectedData** - Collected content from data sources
5. **NotificationHistory** - Notification delivery history
6. **ApiKey** - API key management

## Models

### User
Stores user account information and authentication data.

**Fields:**
- `id` (UUID) - Primary key
- `email` (String) - Unique email address
- `username` (String) - Unique username
- `passwordHash` (String) - Bcrypt hashed password
- `fullName` (String?) - Full name (optional)
- `avatarUrl` (String?) - Avatar image URL (optional)
- `timezone` (String) - User timezone (default: UTC)
- `language` (String) - Preferred language (default: en)
- `emailVerified` (Boolean) - Email verification status
- `isActive` (Boolean) - Account active status
- `subscriptionTier` (String) - Subscription level: free, pro, enterprise
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `lastLoginAt` (DateTime?) - Last login timestamp

**Relations:**
- Has many DataSources
- Has many NotificationRules
- Has many NotificationHistory entries
- Has many ApiKeys

### DataSource
Configuration for information sources to collect data from.

**Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to User
- `name` (String) - Display name
- `type` (String) - Source type: rss, twitter, web, news_api, webhook
- `config` (JSON) - Type-specific configuration
- `isActive` (Boolean) - Active/inactive status
- `checkInterval` (Int) - Check interval in seconds (default: 300)
- `lastCheckedAt` (DateTime?) - Last check timestamp
- `lastSuccessAt` (DateTime?) - Last successful collection
- `errorCount` (Int) - Error counter
- `lastError` (String?) - Last error message
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Config Examples:**
```json
// RSS
{
  "url": "https://example.com/feed.xml",
  "category": "technology"
}

// Twitter
{
  "accounts": ["@user1", "@user2"],
  "keywords": ["AI", "ML"]
}

// Web Scraping
{
  "url": "https://example.com",
  "selector": ".article-title"
}
```

**Relations:**
- Belongs to User
- Has many CollectedData entries

### NotificationRule
Rules for filtering and delivering notifications.

**Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to User
- `name` (String) - Rule name
- `description` (String?) - Rule description
- `keywords` (String[]) - Keywords to match
- `excludeKeywords` (String[]) - Keywords to exclude
- `sourceTypes` (String[]) - Source types to monitor
- `priority` (Int) - Priority level (higher = more important)
- `channels` (JSON) - Notification channel configuration
- `schedule` (JSON?) - Delivery schedule
- `quietHours` (JSON?) - Silent hours configuration
- `batchEnabled` (Boolean) - Enable batch notifications
- `batchInterval` (Int?) - Batch interval in minutes
- `maxPerBatch` (Int?) - Max notifications per batch
- `isActive` (Boolean) - Active/inactive status
- `lastTriggeredAt` (DateTime?) - Last trigger timestamp
- `triggerCount` (Int) - Total trigger count
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Channels Configuration:**
```json
{
  "email": {
    "enabled": true,
    "address": "user@example.com"
  },
  "push": {
    "enabled": true,
    "deviceIds": ["device1", "device2"]
  },
  "webhook": {
    "enabled": false,
    "url": "https://webhook.example.com"
  },
  "desktop": {
    "enabled": true
  }
}
```

**Relations:**
- Belongs to User
- Has many NotificationHistory entries

### CollectedData
Content collected from data sources.

**Fields:**
- `id` (UUID) - Primary key
- `dataSourceId` (UUID) - Foreign key to DataSource
- `title` (String) - Content title
- `content` (Text) - Full content
- `summary` (Text?) - Content summary
- `url` (String) - Unique content URL
- `author` (String?) - Content author
- `publishedAt` (DateTime?) - Publication timestamp
- `language` (String?) - Content language
- `tags` (String[]) - Content tags
- `categories` (String[]) - Content categories
- `sentiment` (Float?) - Sentiment score (-1 to 1)
- `keywords` (String[]) - Extracted keywords
- `entities` (String[]) - Extracted entities
- `imageUrl` (String?) - Featured image URL
- `videoUrl` (String?) - Video URL
- `isProcessed` (Boolean) - Processing status
- `notified` (Boolean) - Notification sent status
- `notifiedAt` (DateTime?) - Notification timestamp
- `collectedAt` (DateTime) - Collection timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- Belongs to DataSource
- Has many NotificationHistory entries

### NotificationHistory
History of sent notifications.

**Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to User
- `notificationRuleId` (UUID?) - Foreign key to NotificationRule
- `collectedDataId` (UUID) - Foreign key to CollectedData
- `channel` (String) - Delivery channel: email, push, webhook, desktop
- `status` (String) - Status: pending, sent, failed, read
- `recipient` (String?) - Recipient identifier
- `subject` (String?) - Notification subject
- `message` (Text?) - Notification message
- `metadata` (JSON?) - Additional metadata
- `sentAt` (DateTime?) - Send timestamp
- `readAt` (DateTime?) - Read timestamp
- `failedAt` (DateTime?) - Failure timestamp
- `errorMessage` (String?) - Error message if failed
- `retryCount` (Int) - Number of retry attempts
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- Belongs to User
- Belongs to NotificationRule (optional)
- Belongs to CollectedData

### ApiKey
API keys for programmatic access.

**Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to User
- `keyHash` (String) - Hashed API key
- `name` (String) - Key name/description
- `permissions` (JSON) - Permission settings
- `lastUsedAt` (DateTime?) - Last use timestamp
- `expiresAt` (DateTime?) - Expiration timestamp
- `isActive` (Boolean) - Active/inactive status
- `createdAt` (DateTime) - Creation timestamp

**Permissions Example:**
```json
{
  "read": true,
  "write": true,
  "delete": false,
  "admin": false
}
```

**Relations:**
- Belongs to User

## Indexes

Performance indexes are created on:
- User: email, username
- DataSource: userId, type, isActive, lastCheckedAt
- NotificationRule: userId, isActive, priority
- CollectedData: dataSourceId, collectedAt, isProcessed, notified, publishedAt
- NotificationHistory: userId, status, channel, createdAt, sentAt
- ApiKey: userId, keyHash

## Migrations

### Running Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seeding Data

The database can be seeded with demo data:

```bash
npm run prisma:seed
```

This creates:
- 2 demo users (demo@iah.example.com, john@example.com)
- 4 data sources (RSS, Web, Twitter, News API)
- 3 notification rules
- 4 sample collected data entries
- 3 notification history entries
- API keys

**Demo Credentials:**
- Email: `demo@iah.example.com`
- Password: `password123`

## Entity Relationships

```
User (1) ──< (N) DataSource (1) ──< (N) CollectedData
 │                                           │
 │                                           │
 ├─< (N) NotificationRule ──────────────────┤
 │                                           │
 │                                           │
 └─< (N) NotificationHistory >───────────────┘
 │
 └─< (N) ApiKey
```

## JSON Field Schemas

### DataSource.config

Varies by type:

**RSS:**
```typescript
{
  url: string;
  category?: string;
}
```

**Twitter:**
```typescript
{
  accounts: string[];
  keywords?: string[];
  hashtags?: string[];
}
```

**Web:**
```typescript
{
  url: string;
  selector: string;
  interval?: number;
}
```

**News API:**
```typescript
{
  apiKey: string;
  category?: string;
  country?: string;
  sources?: string[];
}
```

### NotificationRule.channels

```typescript
{
  email?: {
    enabled: boolean;
    address: string;
  };
  push?: {
    enabled: boolean;
    deviceIds?: string[];
  };
  webhook?: {
    enabled: boolean;
    url: string;
    secret?: string;
  };
  desktop?: {
    enabled: boolean;
  };
}
```

### NotificationRule.quietHours

```typescript
{
  enabled: boolean;
  start: string; // "22:00"
  end: string;   // "07:00"
  timezone: string;
  days?: number[]; // [0-6] 0=Sunday
}
```

## Best Practices

1. **Always use transactions** for operations that modify multiple tables
2. **Use indexes** for frequently queried fields
3. **Soft delete** important data by using `isActive` flags
4. **Hash sensitive data** like passwords and API keys
5. **Use UUIDs** for primary keys to avoid enumeration attacks
6. **Validate JSON fields** before storing to ensure data consistency
7. **Clean up old data** periodically (e.g., old notification history)

## Performance Considerations

- **Collected Data**: This table will grow quickly. Consider:
  - Archiving old data (>90 days)
  - Partitioning by date
  - Regular cleanup of processed data

- **Notification History**: Similar concerns:
  - Archive old notifications
  - Clean up read notifications after 30 days

- **Indexes**: Monitor slow queries and add indexes as needed

## Security

- **Password Hashing**: Uses bcrypt with cost factor 10
- **API Keys**: Hashed before storage
- **Cascade Deletes**: Enabled to maintain referential integrity
- **Row-Level Security**: Consider implementing for multi-tenant scenarios
