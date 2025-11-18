import { FastifyPluginAsync } from 'fastify';
import { jobService } from '../services/job.service';
import { validate } from '../middlewares/validate';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import { createCollectJobSchema } from '../schemas/validation';
import { z } from 'zod';

const jobIdParamSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
});

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // POST /api/v1/jobs/collect
  fastify.post(
    '/collect',
    {
      preHandler: [validate(createCollectJobSchema, 'body')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { sourceId, force = false } = request.body as any;
      const job = await jobService.createCollectJob(sourceId, request.user!.id, force);

      return reply.status(201).send({
        success: true,
        message: 'Data collection job created successfully',
        data: job,
      });
    }
  );

  // GET /api/v1/jobs/status/:id
  fastify.get(
    '/status/:id',
    {
      preHandler: [validate(jobIdParamSchema, 'params')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as any;
      const status = await jobService.getJobStatus(id);

      return reply.send({
        success: true,
        data: status,
      });
    }
  );

  // GET /api/v1/jobs/stats
  fastify.get('/stats', async (request: AuthenticatedRequest, reply) => {
    const stats = await jobService.getQueueStats();

    return reply.send({
      success: true,
      data: stats,
    });
  });
};
