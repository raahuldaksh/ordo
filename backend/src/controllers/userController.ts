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
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  }

  static async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { fullName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: { fullName } },
      { new: true }
    ).select('-passwordHash');
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
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: new Types.ObjectId(req.user!.userId) },
      { $set: req.body },
      { new: true, upsert: true }
    );
    sendSuccess(res, preferences);
  }

  static async exportUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = new Types.ObjectId(req.user!.userId);
    const [user, preferences, tasks, outcomes, routines, reviews] = await Promise.all([
      User.findById(uid).select('-passwordHash'),
      UserPreferences.findOne({ userId: uid }),
      Task.find({ userId: uid }),
      TaskOutcome.find({ userId: uid }),
      RoutineTemplate.find({ userId: uid }),
      WeeklyReview.find({ userId: uid })
    ]);

    sendSuccess(res, {
      exportedAt: new Date().toISOString(),
      user,
      preferences,
      tasks,
      outcomes,
      routines,
      reviews
    });
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const uid = new Types.ObjectId(req.user!.userId);

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

    res.clearCookie('ordo_access_token');
    res.clearCookie('ordo_refresh_token');
    sendSuccess(res, { message: 'Account and all associated personal data permanently deleted.' });
  }
}

