import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationController {
  static async listNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notifications = await NotificationService.listNotifications(req.user!.userId);
      sendSuccess(res, notifications);
    } catch (err: any) {
      sendError(res, err.code || 'LIST_NOTIFICATIONS_FAILED', err.message, err.status || 400);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notification = await NotificationService.markAsRead(req.user!.userId, req.params.notificationId as string);
      sendSuccess(res, notification);
    } catch (err: any) {
      sendError(res, err.code || 'MARK_READ_FAILED', err.message, err.status || 400);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'MARK_ALL_READ_FAILED', err.message, err.status || 400);
    }
  }
}
