# Database Setup Guide

This guide explains how to set up and manage the database for the Intelligent Alert Hub project.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed
- Project dependencies installed (`npm install`)

## Quick Start

### 1. Start the Database

```bash
# Start PostgreSQL and Redis with Docker Compose
npm run docker:up

# Or start only the database
docker-compose up -d postgres redis
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp apps/api/.env.example apps/api/.env
```

The default `.env` contains:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iah
```

If using Docker Compose, the database is already configured correctly.

### 3. Generate Prisma Client

Generate the Prisma Client from your schema:

```bash
cd apps/api
npm run prisma:generate
```

Or from the root:
```bash
npm run prisma:generate
```

### 4. Run Migrations

Create and apply the database schema:

```bash
cd apps/api
npm run prisma:migrate

# Or with a custom name
npx prisma migrate dev --name init
```

This will:
1. Create the database if it doesn't exist
2. Apply all migrations
3. Generate the Prisma Client

### 5. Seed the Database

Populate the database with demo data:

```bash
cd apps/api
npm run prisma:seed
```

This creates:
- 2 demo users
- 4 data sources
- 3 notification rules
- 4 sample collected data entries
- 3 notification history entries

**Demo Credentials:**
- Email: `demo@iah.example.com`
- Password: `password123`

## Database Management

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens a web interface at http://localhost:5555 to browse and edit data.

### Reset Database

⚠️ **Warning:** This will delete all data!

```bash
cd apps/api
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed script

### Create a New Migration

After modifying `schema.prisma`:

```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
```

### Check Migration Status

```bash
cd apps/api
npx prisma migrate status
```

### Deploy Migrations (Production)

```bash
cd apps/api
npx prisma migrate deploy
```

## Database Schema Overview

### Models

1. **User** - User accounts and authentication
   - Supports multiple subscription tiers (free, pro, enterprise)
   - Email verification and account status tracking

2. **DataSource** - Information source configurations
   - Supports: RSS, Twitter, Web scraping, News API, Webhooks
   - Configurable check intervals and error tracking

3. **NotificationRule** - Notification rules and filters
   - Keyword-based filtering (include/exclude)
   - Multi-channel support (Email, Push, Webhook, Desktop)
   - Batch notifications and quiet hours

4. **CollectedData** - Content collected from sources
   - Full-text content with metadata
   - Sentiment analysis and keyword extraction
   - Processing status tracking

5. **NotificationHistory** - Notification delivery tracking
   - Complete delivery history
   - Status tracking (pending, sent, failed, read)
   - Retry logic support

6. **ApiKey** - API key management
   - Hashed storage for security
   - Permission-based access control

### Relationships

```
User (1:N)
├── DataSources
├── NotificationRules
├── NotificationHistory
└── ApiKeys

DataSource (1:N)
└── CollectedData

NotificationRule (1:N)
└── NotificationHistory

CollectedData (1:N)
└── NotificationHistory
```

## Common Tasks

### Add a New Field

1. Edit `apps/api/prisma/schema.prisma`
2. Run migration:
   ```bash
   cd apps/api
   npx prisma migrate dev --name add_new_field
   ```
3. Regenerate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

### Backup Database

```bash
# Using Docker
docker exec iah-postgres pg_dump -U postgres iah > backup.sql

# Restore
docker exec -i iah-postgres psql -U postgres iah < backup.sql
```

### Connect to Database Directly

```bash
# Using Docker
docker exec -it iah-postgres psql -U postgres -d iah

# Using psql directly
psql postgresql://postgres:postgres@localhost:5432/iah
```

### Check Database Size

```sql
SELECT
  pg_size_pretty(pg_database_size('iah')) as database_size;

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check DATABASE_URL in `.env`:
   ```bash
   cat apps/api/.env | grep DATABASE_URL
   ```

3. Test connection:
   ```bash
   docker exec -it iah-postgres psql -U postgres -d iah -c "SELECT 1;"
   ```

### Migration Conflicts

If migrations are out of sync:

```bash
# Development: Reset and start fresh
cd apps/api
npx prisma migrate reset

# Production: Resolve conflicts manually
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy
```

### Prisma Client Issues

If you see "Prisma Client not found":

```bash
cd apps/api
npm run prisma:generate
```

### Port Already in Use

If port 5432 is already in use:

```bash
# Find process using port
lsof -ti:5432

# Kill process
lsof -ti:5432 | xargs kill -9

# Or change port in docker-compose.yml
```

## Performance Tips

### Indexes

The schema includes indexes on frequently queried fields:
- User: email, username
- DataSource: userId, type, isActive
- NotificationRule: userId, isActive, priority
- CollectedData: dataSourceId, collectedAt, isProcessed
- NotificationHistory: userId, status, channel

### Connection Pooling

Prisma automatically handles connection pooling. Adjust if needed:

```env
DATABASE_URL=postgresql://user:password@host:5432/db?connection_limit=10
```

### Query Optimization

Use Prisma's built-in query optimization:

```typescript
// Include related data in one query
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    dataSources: true,
    notificationRules: true,
  },
});

// Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    username: true,
  },
});
```

## Development vs Production

### Development

- Use `prisma migrate dev` for schema changes
- Seed data is automatically run after reset
- Use Prisma Studio for debugging

### Production

- Use `prisma migrate deploy` for applying migrations
- Never run `prisma migrate reset` in production
- Use proper backup strategies
- Enable SSL for database connections
- Use connection pooling (PgBouncer)

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema README](./apps/api/prisma/README.md)

## Next Steps

After setting up the database:

1. ✅ Database is ready
2. Start the API server: `npm run dev:api`
3. Implement authentication endpoints
4. Create data collection workers
5. Build notification system

---

For detailed schema documentation, see [apps/api/prisma/README.md](./apps/api/prisma/README.md)
