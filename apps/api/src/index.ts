import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/auth';
import { sourceRoutes } from './routes/sources';
import { ruleRoutes } from './routes/rules';
import { jobRoutes } from './routes/jobs';
import { startCollectWorker } from './services/job.service';
import { schedulerService } from './services/scheduler.service';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register error handler
fastify.setErrorHandler(errorHandler);

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // JWT authentication
  await fastify.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtExpiresIn,
    },
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });
}

// Register routes
async function registerRoutes() {
  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(sourceRoutes, { prefix: '/api/v1/sources' });
  await fastify.register(ruleRoutes, { prefix: '/api/v1/rules' });
  await fastify.register(jobRoutes, { prefix: '/api/v1/jobs' });
}

// Health check endpoint
fastify.get('/health', async () => {
  return {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  };
});

// API info endpoint
fastify.get('/api/v1', async () => {
  return {
    success: true,
    name: 'Intelligent Alert Hub API',
    version: '1.0.0',
    description: 'RESTful API for intelligent information collection and notification system',
    endpoints: {
      auth: '/api/v1/auth',
      sources: '/api/v1/sources',
      rules: '/api/v1/rules',
      jobs: '/api/v1/jobs',
      health: '/health',
    },
  };
});

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: 'Not Found',
    message: `Route ${request.method}:${request.url} not found`,
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    fastify.log.info(`Server listening on ${config.host}:${config.port}`);
    fastify.log.info(`Environment: ${config.nodeEnv}`);

    // Start background services
    if (config.nodeEnv !== 'test') {
      startCollectWorker();
      fastify.log.info('Background job worker started');

      await schedulerService.start();
      fastify.log.info('Scheduler service started');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server...`);

    // Stop scheduler
    schedulerService.stop();

    await fastify.close();
    process.exit(0);
  });
});

start();

// Export for testing
export { fastify };
