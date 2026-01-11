import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    err,
    method: req.method,
    url: req.url,
    statusCode,
  });

  res.status(statusCode).json({
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

export function createError(message: string, statusCode = 500, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function notFound(message = 'Resource not found'): AppError {
  return createError(message, 404, 'NOT_FOUND');
}

export function badRequest(message = 'Bad request'): AppError {
  return createError(message, 400, 'BAD_REQUEST');
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return createError(message, 401, 'UNAUTHORIZED');
}
