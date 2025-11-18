import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request[source];
      const validated = await schema.parseAsync(data);

      // Replace the original data with validated data
      (request as any)[source] = validated;
    } catch (error) {
      // Error will be caught by errorHandler middleware
      throw error;
    }
  };
}
