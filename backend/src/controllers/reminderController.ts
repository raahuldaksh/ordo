import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { ReminderService } from '../services/reminderService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ReminderController {
  static async listReminders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reminders = await ReminderService.listReminders(req.user!.userId);
      sendSuccess(res, reminders);
    } catch (err: any) {
      sendError(res, err.code || 'LIST_REMINDERS_FAILED', err.message, err.status || 400);
    }
  }

  static async createReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reminder = await ReminderService.createReminder(req.user!.userId, req.body);
      sendSuccess(res, reminder, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'CREATE_REMINDER_FAILED', err.message, err.status || 400);
    }
  }

  static async updateReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reminder = await ReminderService.updateReminder(req.user!.userId, req.params.reminderId as string, req.body);
      sendSuccess(res, reminder);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_REMINDER_FAILED', err.message, err.status || 400);
    }
  }

  static async deleteReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await ReminderService.deleteReminder(req.user!.userId, req.params.reminderId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_REMINDER_FAILED', err.message, err.status || 400);
    }
  }
}
