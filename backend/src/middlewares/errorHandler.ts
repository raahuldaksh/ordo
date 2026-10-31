import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (res.locals.requestId as string) || 'req-unknown';
  logger.error('Unhandled Application Error', {
    requestId,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Check for Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 'INVALID_RESOURCE_ID', `Invalid identifier format: ${err.value}`, 400, [], requestId);
    return;
  }

  // Check for Mongo unique key collision
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    sendError(res, 'CONFLICT_ERROR', `A record with this ${field} already exists.`, 409, [], requestId);
    return;
  }

  // Generic 500 error
  sendError(res, 'INTERNAL_SERVER_ERROR', 'An unexpected internal error occurred. Please try again later.', 500, [], requestId);
}

