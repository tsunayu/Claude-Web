import { FastifyPluginAsync } from 'fastify';
import { dataSourceService } from '../services/dataSource.service';
import { validate } from '../middlewares/validate';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import {
  createDataSourceSchema,
  updateDataSourceSchema,
  dataSourceQuerySchema,
} from '../schemas/validation';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid('Invalid source ID'),
});

export const sourceRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // GET /api/v1/sources
  fastify.get(
    '/',
    {
      preHandler: [validate(dataSourceQuerySchema, 'query')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const result = await dataSourceService.findAll(request.user!.id, request.query as any);

      return reply.send({
        success: true,
        ...result,
      });
    }
  );

  // POST /api/v1/sources
  fastify.post(
    '/',
    {
      preHandler: [validate(createDataSourceSchema, 'body')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const dataSource = await dataSourceService.create(request.user!.id, request.body as any);

      return reply.status(201).send({
        success: true,
        message: 'Data source created successfully',
        data: dataSource,
      });
    }
  );

  // GET /api/v1/sources/:id
  fastify.get(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const dataSource = await dataSourceService.findById(id, request.user!.id);

      return reply.send({
        success: true,
        data: dataSource,
      });
    }
  );

  // PUT /api/v1/sources/:id
  fastify.put(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params'), validate(updateDataSourceSchema, 'body')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const dataSource = await dataSourceService.update(id, request.user!.id, request.body as any);

      return reply.send({
        success: true,
        message: 'Data source updated successfully',
        data: dataSource,
      });
    }
  );

  // DELETE /api/v1/sources/:id
  fastify.delete(
    '/:id',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const result = await dataSourceService.delete(id, request.user!.id);

      return reply.send({
        success: true,
        ...result,
      });
    }
  );

  // GET /api/v1/sources/:id/stats
  fastify.get(
    '/:id/stats',
    {
      preHandler: [validate(idParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const stats = await dataSourceService.getStats(id, request.user!.id);

      return reply.send({
        success: true,
        data: stats,
      });
    }
  );
};
