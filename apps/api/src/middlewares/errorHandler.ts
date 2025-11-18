import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      message: 'Invalid input data',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      return reply.status(409).send({
        success: false,
        error: 'Conflict',
        message: `A record with this ${target.join(', ')} already exists`,
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Invalid reference to related resource',
      });
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      message: 'Invalid data provided',
    });
  }

  // Custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.code || 'Error',
      message: error.message,
    });
  }

  // Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.name || 'Error',
      message: error.message,
    });
  }

  // Default error response
  const statusCode = 500;
  return reply.status(statusCode).send({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
  });
}
