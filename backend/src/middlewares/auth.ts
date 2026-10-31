import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check authorization header or cookie
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.ordo_access_token) {
    token = req.cookies.ordo_access_token;
  }

  if (!token) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required to access this resource', 401);
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    sendError(res, 'TOKEN_EXPIRED_OR_INVALID', 'Session expired. Please log in again.', 401);
    return;
  }

  req.user = payload;
  next();
}

