import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import {
  User,
  UserPreferences,
  Task,
  TaskOutcome,
  RoutineTemplate,
  RoutineTemplateItem,
  CalendarConnection,
  CalendarEvent,
  Reminder,
  Notification,
  WeeklyReview,
  AiInsight
} from '../models/index.js';
import { comparePassword } from '../utils/crypto.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await User.findById(req.user!.userId).select('-passwordHash -resetPasswordTokenHash -emailVerificationTokenHash');
    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  }

  static async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Strictly allowlisted properties only (PRD §7 - mass assignment defense)
    const { fullName } = req.body;
    const updates: Record<string, any> = {};
    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      updates.fullName = fullName.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true }
    ).select('-passwordHash -resetPasswordTokenHash -emailVerificationTokenHash');

    sendSuccess(res, user);
  }

  static async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    let preferences = await UserPreferences.findOne({ userId: new Types.ObjectId(req.user!.userId) });
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: new Types.ObjectId(req.user!.userId),
        timezone: 'UTC',
        theme: 'system'
      });
    }
    sendSuccess(res, preferences);
  }

  static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Strictly allowlisted properties only (PRD §7)
    const allowed = [
      'timezone',
      'theme',
      'locale',
      'timeFormat',
      'weekStartsOn',
      'defaultTaskDurationMinutes',
      'wakeTimeLocal',
      'sleepTimeLocal',
      'quietHours',
      'notificationPreferences'
    ];

    const safeUpdates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        safeUpdates[key] = req.body[key];
      }
    }

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: new Types.ObjectId(req.user!.userId) },
      { $set: safeUpdates },
      { new: true, upsert: true }
    );
    sendSuccess(res, preferences);
  }

  static async exportUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = new Types.ObjectId(req.user!.userId);
    const user = await User.findById(uid);
    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }

    // Re-authentication check for password-authenticated users (PRD §5 & §6)
    if (user.passwordHash) {
      const { password } = req.body;
      if (!password) {
        sendError(res, 'REAUTHENTICATION_REQUIRED', 'Password confirmation is required to export personal data.', 401);
        return;
      }
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'INVALID_PASSWORD', 'Invalid password. Export aborted.', 401);
        return;
      }
    }

    const [preferences, tasks, outcomes, routines, reviews] = await Promise.all([
      UserPreferences.findOne({ userId: uid }),
      Task.find({ userId: uid }),
      TaskOutcome.find({ userId: uid }),
      RoutineTemplate.find({ userId: uid }),
      WeeklyReview.find({ userId: uid })
    ]);

    const sanitizedUser = user.toObject();
    delete (sanitizedUser as any).passwordHash;
    delete (sanitizedUser as any).resetPasswordTokenHash;
    delete (sanitizedUser as any).emailVerificationTokenHash;

    sendSuccess(res, {
      exportedAt: new Date().toISOString(),
      user: sanitizedUser,
      preferences,
      tasks,
      outcomes,
      routines,
      reviews
    });
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = new Types.ObjectId(req.user!.userId);
    const user = await User.findById(uid);
    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }

    // Mandatory re-authentication check for account deletion (PRD §3 & §5)
    if (user.passwordHash) {
      const { password } = req.body;
      if (!password) {
        sendError(res, 'REAUTHENTICATION_REQUIRED', 'Password confirmation is required to permanently delete account.', 401);
        return;
      }
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'INVALID_PASSWORD', 'Invalid password. Account deletion aborted.', 401);
        return;
      }
    }

    // Cascading purge of all user data matching PRD §11.17
    await Promise.all([
      User.deleteOne({ _id: uid }),
      UserPreferences.deleteOne({ userId: uid }),
      Task.deleteMany({ userId: uid }),
      TaskOutcome.deleteMany({ userId: uid }),
      RoutineTemplate.deleteMany({ userId: uid }),
      RoutineTemplateItem.deleteMany({ userId: uid }),
      CalendarConnection.deleteMany({ userId: uid }),
      CalendarEvent.deleteMany({ userId: uid }),
      Reminder.deleteMany({ userId: uid }),
      Notification.deleteMany({ userId: uid }),
      WeeklyReview.deleteMany({ userId: uid }),
      AiInsight.deleteMany({ userId: uid })
    ]);

    res.clearCookie('ordo_access_token', { path: '/' });
    res.clearCookie('ordo_refresh_token', { path: '/' });
    res.clearCookie('ordo_csrf_token', { path: '/' });
    sendSuccess(res, { message: 'Account and all associated personal data permanently deleted.' });
  }
}
