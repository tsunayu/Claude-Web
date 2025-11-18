import { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/auth.service';
import { validate } from '../middlewares/validate';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import { registerSchema, loginSchema } from '../schemas/validation';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/auth/register
  fastify.post(
    '/register',
    {
      preHandler: [validate(registerSchema, 'body')],
    },
    async (request, reply) => {
      const user = await authService.register(request.body as any);

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
      });

      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
        },
      });
    }
  );

  // POST /api/v1/auth/login
  fastify.post(
    '/login',
    {
      preHandler: [validate(loginSchema, 'body')],
    },
    async (request, reply) => {
      const user = await authService.login(request.body as any);

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
      });

      return reply.send({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
        },
      });
    }
  );

  // POST /api/v1/auth/logout
  fastify.post(
    '/logout',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // In a stateless JWT setup, logout is typically handled client-side
      // by removing the token. For added security, you could implement
      // a token blacklist here.

      return reply.send({
        success: true,
        message: 'Logout successful',
      });
    }
  );

  // GET /api/v1/auth/me
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = await authService.getUserById(request.user!.id);

      return reply.send({
        success: true,
        data: user,
      });
    }
  );
};
