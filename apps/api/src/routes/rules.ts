import { FastifyPluginAsync } from 'fastify';
import { notificationRuleService } from '../services/notificationRule.service';
import { validate } from '../middlewares/validate';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import {
  createNotificationRuleSchema,
  updateNotificationRuleSchema,
  notificationRuleQuerySchema,
} from '../schemas/validation';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid('Invalid rule ID'),
});

export const ruleRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // GET /api/v1/rules
  fastify.get(
    '/',
    {
      preHandler: [validate(notificationRuleQuerySchema, 'query')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const result = await notificationRuleService.findAll(request.user!.id, request.query as any);

      return reply.send({
        success: true,
        ...result,
      });
    }
  );

  // POST /api/v1/rules
  fastify.post(
    '/',
    {
      preHandler: [validate(createNotificationRuleSchema, 'body')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const rule = await notificationRuleService.create(request.user!.id, request.body as any);

      return reply.status(201).send({
        success: true,
        message: 'Notification rule created successfully',
        data: rule,
      });
    }
  );

  // GET /api/v1/rules/:id
  fastify.get(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const rule = await notificationRuleService.findById(id, request.user!.id);

      return reply.send({
        success: true,
        data: rule,
      });
    }
  );

  // PUT /api/v1/rules/:id
  fastify.put(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params'), validate(updateNotificationRuleSchema, 'body')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const rule = await notificationRuleService.update(id, request.user!.id, request.body as any);

      return reply.send({
        success: true,
        message: 'Notification rule updated successfully',
        data: rule,
      });
    }
  );

  // DELETE /api/v1/rules/:id
  fastify.delete(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const result = await notificationRuleService.delete(id, request.user!.id);

      return reply.send({
        success: true,
        ...result,
      });
    }
  );

  // GET /api/v1/rules/:id/stats
  fastify.get(
    '/:id/stats',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const stats = await notificationRuleService.getStats(id, request.user!.id);

      return reply.send({
        success: true,
        data: stats,
      });
    }
  );
};
