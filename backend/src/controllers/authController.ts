import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { generateCsrfToken } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, result, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'REGISTRATION_FAILED', err.message || 'Registration failed', err.status || 400);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress
      };
      const result = await AuthService.login(req.body, clientInfo);
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'LOGIN_FAILED', err.message || 'Login failed', err.status || 400);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('ordo_access_token', { path: '/' });
    res.clearCookie('ordo_refresh_token', { path: '/' });
    sendSuccess(res, { message: 'Logged out successfully' });
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await AuthService.getMe(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_USER_FAILED', err.message || 'Failed to fetch user', err.status || 404);
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'FORGOT_PASSWORD_FAILED', err.message, err.status || 400);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.password);
      res.clearCookie('ordo_access_token', { path: '/' });
      res.clearCookie('ordo_refresh_token', { path: '/' });
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'RESET_PASSWORD_FAILED', err.message, err.status || 400);
    }
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.verifyEmail(req.body.token);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'VERIFY_EMAIL_FAILED', err.message, err.status || 400);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      // Clear cookies as all sessions are revoked
      res.clearCookie('ordo_access_token', { path: '/' });
      res.clearCookie('ordo_refresh_token', { path: '/' });
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'CHANGE_PASSWORD_FAILED', err.message, err.status || 400);
    }
  }

  static redirectToGoogle(req: Request, res: Response): void {
    try {
      const state = req.query.state as string;
      const url = AuthService.getGoogleAuthUrl(state);
      res.redirect(url);
    } catch (err: any) {
      sendError(res, err.code || 'GOOGLE_AUTH_FAILED', err.message, err.status || 500);
    }
  }

  static async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.redirect(`${config.frontendUrl}/login?error=missing_code`);
        return;
      }

      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ip: (req.ip || req.socket.remoteAddress) as string
      };

      const result = await AuthService.handleGoogleCallback(code, clientInfo);

      // Set HttpOnly session cookies
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);

      // Redirect user directly into the dashboard
      res.redirect(`${config.frontendUrl}/dashboard`);
    } catch (err: any) {
      logger.error('Google OAuth callback failed', { error: err.message });
      res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
    }
  }

  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ip: (req.ip || req.socket.remoteAddress) as string
      };
      const result = await AuthService.handleGoogleAuth(req.body, clientInfo);
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'GOOGLE_AUTH_FAILED', err.message, err.status || 400);
    }
  }

  static async getCsrfToken(req: Request, res: Response): Promise<void> {
    let token = req.cookies.ordo_csrf_token;
    if (!token) {
      token = generateCsrfToken();
      res.cookie('ordo_csrf_token', token, {
        httpOnly: false,
        secure: config.env === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    sendSuccess(res, { csrfToken: token });
  }

  static async listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessions = await AuthService.listSessions(req.user!.userId);
      sendSuccess(res, sessions);
    } catch (err: any) {
      sendError(res, err.code || 'SESSIONS_FETCH_FAILED', err.message, err.status || 400);
    }
  }

  static async revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.revokeAllSessions(req.user!.userId);
      res.clearCookie('ordo_access_token', { path: '/' });
      res.clearCookie('ordo_refresh_token', { path: '/' });
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'REVOKE_SESSIONS_FAILED', err.message, err.status || 400);
    }
  }
}
