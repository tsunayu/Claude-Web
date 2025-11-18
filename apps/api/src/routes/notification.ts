import { FastifyPluginAsync } from 'fastify';

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/notifications/log
  fastify.get('/log', async (request, reply) => {
    // TODO: Implement get notification logs
    return { message: 'Get notification logs - To be implemented' };
  });

  // GET /api/v1/notifications/config
  fastify.get('/config', async (request, reply) => {
    // TODO: Implement get notification configs
    return { message: 'Get notification configs - To be implemented' };
  });

  // POST /api/v1/notifications/config
  fastify.post('/config', async (request, reply) => {
    // TODO: Implement create notification config
    return { message: 'Create notification config - To be implemented' };
  });

  // GET /api/v1/notifications/unread-count
  fastify.get('/unread-count', async (request, reply) => {
    // TODO: Implement get unread count
    return { message: 'Get unread count - To be implemented' };
  });
};
