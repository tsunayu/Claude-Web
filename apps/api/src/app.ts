import Fastify, { FastifyInstance } from 'fastify';
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

export async function build(): Promise<FastifyInstance> {
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

  // Register plugins
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  });

  await fastify.register(jwt, {
    secret: config.jwtSecret,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Health check endpoint
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API info endpoint
  fastify.get('/api/v1', async () => ({
    name: 'Intelligent Alert Hub API',
    version: '1.0.0',
    description: 'API for intelligent information collection and notification system',
  }));

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(sourceRoutes, { prefix: '/api/v1/sources' });
  await fastify.register(ruleRoutes, { prefix: '/api/v1/rules' });
  await fastify.register(jobRoutes, { prefix: '/api/v1/jobs' });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
      statusCode: 404,
    });
  });

  return fastify;
}
