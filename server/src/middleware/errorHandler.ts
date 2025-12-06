import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  details?: any;
  timestamp?: string;
}

/**
 * Error handling middleware
 * Standardizes error responses and handles different error types
 */
export function errorHandler(
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = (err as ApiError).statusCode || 500;
  
  // Log error for debugging
  logger.error({
    err,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode
  }, 'Request error');
  const response: ErrorResponse = {
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  // Add details if available
  if ((err as ApiError).details) {
    response.details = (err as ApiError).details;
  }

  // Don't expose internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.error = 'Internal server error';
    delete response.details;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Resource not found',
    details: `The requested resource ${req.method} ${req.path} was not found`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create a standardized API error
 */
export function createError(message: string, statusCode: number = 400, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
}

