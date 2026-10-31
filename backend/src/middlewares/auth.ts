import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { User, IUser } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tokenVersion?: number;
    sessionId?: string;
  };
  currentUser?: IUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

  // Database verification for account status & session token revocation (PRD §3 & §6)
  const user = await User.findById(payload.userId);
  if (!user) {
    sendError(res, 'USER_NOT_FOUND', 'User account no longer exists', 401);
    return;
  }

  if (user.accountStatus === 'SUSPENDED') {
    sendError(res, 'ACCOUNT_SUSPENDED', 'This account has been suspended.', 403);
    return;
  }

  // Token version revocation check: if user changed password or revoked sessions, old tokens are instantly invalidated
  if (payload.tokenVersion !== undefined && payload.tokenVersion < user.tokenVersion) {
    sendError(res, 'SESSION_REVOKED', 'This session has been revoked. Please log in again.', 401);
    return;
  }

  req.user = payload;
  req.currentUser = user;
  next();
}
