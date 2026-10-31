import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: Record<string, any> = {},
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details: any[] = [],
  requestId?: string
): Response {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId: requestId || (res.locals.requestId as string) || 'req-' + Math.random().toString(36).substring(2, 10)
    }
  });
}

