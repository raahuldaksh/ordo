import { Request, Response, NextFunction } from 'express';

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip keys with dollar prefix ($gt, $ne, $where, etc.) or dot notation
    if (!key.startsWith('$') && !key.includes('.')) {
      sanitized[key] = sanitize(value);
    }
  }
  return sanitized;
}

export function noSqlSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);
  if (req.query) req.query = sanitize(req.query);
  next();
}
