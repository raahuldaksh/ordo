import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { config } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax' as const,
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
      const result = await AuthService.login(req.body);
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'LOGIN_FAILED', err.message || 'Login failed', err.status || 400);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('ordo_access_token');
    res.clearCookie('ordo_refresh_token');
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
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'RESET_PASSWORD_FAILED', err.message, err.status || 400);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'CHANGE_PASSWORD_FAILED', err.message, err.status || 400);
    }
  }

  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { googleId, email, fullName } = req.body;
      if (!email || !fullName) {
        sendError(res, 'INVALID_GOOGLE_PAYLOAD', 'Google email and name are required', 400);
        return;
      }
      const result = await AuthService.handleGoogleAuth({
        googleId: googleId || `g_${Date.now()}`,
        email,
        fullName
      });
      res.cookie('ordo_access_token', result.tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('ordo_refresh_token', result.tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'GOOGLE_AUTH_FAILED', err.message, err.status || 400);
    }
  }
}

