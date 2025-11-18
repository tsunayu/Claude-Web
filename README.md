# Intelligent Alert Hub (IAH)

An intelligent information collection and notification system that automatically gathers data from various sources and delivers timely notifications based on user-defined filters.

## 🚀 Features

- **Multi-Source Collection**: RSS feeds, Twitter/X, Web scraping, News APIs
- **Smart Filtering**: Advanced keyword-based filtering with priority levels
- **Multi-Channel Notifications**: Email, Push, Webhook, and Desktop notifications
- **Customizable Dashboard**: Manage sources, filters, and notifications in one place
- **Real-time Updates**: WebSocket support for instant notifications

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Authentication**: NextAuth.js

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload for both frontend and backend

## 🛠️ Getting Started

### Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Claude-Web
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env

   # Frontend
   cp apps/web/.env.example apps/web/.env
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development environment with Docker**
   ```bash
   # Start all services (PostgreSQL, Redis, API, Web)
   npm run docker:up

   # View logs
   npm run docker:logs

   # Stop all services
   npm run docker:down
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

### Alternative: Run without Docker

1. **Start PostgreSQL and Redis**
   ```bash
   # Make sure PostgreSQL and Redis are running locally
   # PostgreSQL on port 5432
   # Redis on port 6379
   ```

2. **Start backend**
   ```bash
   npm run dev:api
   ```

3. **Start frontend**
   ```bash
   npm run dev:web
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Prisma Studio**: `npm run prisma:studio`

## 📁 Project Structure

```
.
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── config/         # Configuration files
│   │   │   ├── controllers/    # Route controllers
│   │   │   ├── services/       # Business logic
│   │   │   ├── middlewares/    # Custom middlewares
│   │   │   ├── routes/         # API routes
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Utility functions
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── package.json
│   │
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Libraries and utilities
│       │   ├── hooks/          # Custom React hooks
│       │   └── types/          # TypeScript types
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types and utilities
│
├── docker-compose.yml          # Docker Compose configuration
├── package.json                # Root package.json (workspace)
└── README.md
```

## 🔧 Available Scripts

### Root Level

```bash
# Development
npm run dev              # Start both API and Web in development mode
npm run dev:api          # Start only backend
npm run dev:web          # Start only frontend

# Build
npm run build            # Build all workspaces
npm run build:api        # Build backend
npm run build:web        # Build frontend

# Production
npm run start:api        # Start backend in production mode
npm run start:web        # Start frontend in production mode

# Code Quality
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Docker
npm run docker:up        # Start all Docker services
npm run docker:down      # Stop all Docker services
npm run docker:logs      # View Docker logs

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio

# Cleanup
npm run clean            # Remove all node_modules and build artifacts
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts and authentication
- **Source**: Information sources (RSS, Twitter, etc.)
- **Filter**: User-defined content filters
- **NotificationConfig**: Notification channel settings
- **NotificationLog**: Notification history
- **ApiKey**: API key management

See `apps/api/prisma/schema.prisma` for the complete schema.

## 🔐 Environment Variables

### Backend (`apps/api/.env`)

```env
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iah

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`apps/web/.env`)

```env
# Next.js
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token

### User Endpoints

- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update user profile
- `DELETE /api/v1/users/me` - Delete account

### Source Endpoints

- `GET /api/v1/sources` - List all sources
- `POST /api/v1/sources` - Create new source
- `GET /api/v1/sources/:id` - Get source details
- `PUT /api/v1/sources/:id` - Update source
- `DELETE /api/v1/sources/:id` - Delete source

### Filter Endpoints

- `GET /api/v1/filters` - List all filters
- `POST /api/v1/filters` - Create new filter
- `GET /api/v1/filters/:id` - Get filter details
- `PUT /api/v1/filters/:id` - Update filter
- `DELETE /api/v1/filters/:id` - Delete filter

### Notification Endpoints

- `GET /api/v1/notifications/log` - Get notification history
- `GET /api/v1/notifications/config` - Get notification configurations
- `POST /api/v1/notifications/config` - Create notification config
- `GET /api/v1/notifications/unread-count` - Get unread count

### Content Endpoints

- `GET /api/v1/contents` - List collected contents
- `GET /api/v1/contents/:id` - Get content details
- `POST /api/v1/contents/search` - Search contents

## 🚦 Development Workflow

1. **Create a new feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation as needed

3. **Run quality checks**
   ```bash
   npm run lint
   npm run type-check
   npm run format
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🔍 Troubleshooting

### Docker issues

```bash
# Reset Docker environment
npm run docker:down
docker volume prune
npm run docker:up
```

### Database issues

```bash
# Reset database
npm run prisma:migrate reset
npm run prisma:generate
```

### Port already in use

```bash
# Find and kill process using port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## 🧪 Testing

### Unit Tests

```bash
# Backend unit tests
cd apps/api
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Backend integration tests
cd apps/api
npm run test:integration
```

### Test Coverage

Tests are automatically run in CI/CD pipeline. Coverage reports are uploaded to Codecov.

## 🚢 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Production Dockerfile

- Multi-stage builds for optimized image size
- Non-root user for security
- Health checks included
- Proper signal handling with dumb-init

### CI/CD Pipeline

GitHub Actions workflow automatically:
- ✅ Runs tests on push/PR
- ✅ Builds Docker images
- ✅ Pushes to Docker Hub
- ✅ Reports test coverage

### Environment Setup

1. **Set environment variables**
```bash
# Copy and edit production environment file
cp apps/api/.env.example apps/api/.env.production
cp apps/web/.env.example apps/web/.env.production
```

2. **Required Production Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=strong-random-secret
JWT_REFRESH_SECRET=another-strong-secret

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

3. **Deploy to Cloud Platforms**

#### Vercel (Frontend)
```bash
cd apps/web
vercel --prod
```

#### Railway (Full Stack)
```bash
# Connect your GitHub repository to Railway
# Set environment variables in Railway dashboard
# Deploy automatically on push to main
```

#### AWS / DigitalOcean / etc.
- Use `docker-compose.prod.yml`
- Configure reverse proxy (Nginx)
- Set up SSL certificates
- Configure monitoring

## 📊 Monitoring & Logging

### Application Logs

```bash
# View logs with Docker Compose
docker-compose logs -f api
docker-compose logs -f web

# Production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks

- Backend: `GET /health`
- Frontend: `GET /`
- Database: Automated in Docker Compose

### Metrics

- Request rate limiting: 100 req/15min
- Job queue monitoring via BullMQ
- Notification success/failure tracking

## 🔒 Security Best Practices

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure Docker images (non-root user)

## 📖 Additional Documentation

- [System Design Document](./DESIGN_DOCUMENT.md) - Comprehensive system architecture and design
- [API Design](./DESIGN_DOCUMENT.md#5-api設計) - Detailed API specifications
- [Database Schema](./apps/api/prisma/README.md) - Complete database design
- [Database Setup Guide](./DATABASE_SETUP.md) - Database migration guide

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/tooling changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Fastify](https://fastify.dev/) - Fast web framework
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- Design inspired by modern notification systems
- Built with modern web technologies and best practices

## 📮 Support

If you have any questions or issues, please:
- 📧 Open an issue on GitHub
- 💬 Join our discussions
- 📖 Check the documentation

---

**Happy Coding!** 🎉

Made with ❤️ by Claude & You
