import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    username: string;
    subscriptionTier: string;
  };
}

export async function authenticate(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    // JWT payload is automatically attached to request.user by @fastify/jwt
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
      });
    }
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
}

export async function optionalAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Silent fail - user is not authenticated but that's OK
    request.user = undefined;
  }
}

export function requireSubscription(minTier: 'free' | 'pro' | 'enterprise') {
  const tierLevels = { free: 0, pro: 1, enterprise: 2 };

  return async function (request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userTier = request.user.subscriptionTier as keyof typeof tierLevels;
    const requiredLevel = tierLevels[minTier];
    const userLevel = tierLevels[userTier] || 0;

    if (userLevel < requiredLevel) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: `This feature requires ${minTier} subscription or higher`,
      });
    }
  };
}
