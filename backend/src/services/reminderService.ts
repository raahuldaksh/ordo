import { Types } from 'mongoose';
import { Reminder } from '../models/index.js';
import { ReminderStatus, ReminderChannel, ReminderType } from '../constants/enums.js';
import { NotificationService } from './notificationService.js';
import { logger } from '../config/logger.js';

let reminderInterval: ReturnType<typeof setInterval> | null = null;

export class ReminderService {
  static async listReminders(userId: string) {
    return Reminder.find({ userId: new Types.ObjectId(userId) }).sort({ scheduledAt: 1 });
  }

  static async createReminder(userId: string, data: {
    taskId?: string;
    reminderType: ReminderType;
    scheduledAt: string | Date;
    timezone?: string;
    channel?: ReminderChannel;
    title: string;
    body?: string;
    idempotencyKey?: string;
  }) {
    const reminder = await Reminder.create({
      userId: new Types.ObjectId(userId),
      taskId: data.taskId ? new Types.ObjectId(data.taskId) : null,
      reminderType: data.reminderType,
      scheduledAt: new Date(data.scheduledAt),
      timezone: data.timezone || 'UTC',
      channel: data.channel || ReminderChannel.IN_APP,
      status: ReminderStatus.QUEUED,
      title: data.title,
      body: data.body || '',
      idempotencyKey: data.idempotencyKey || null
    });
    return reminder;
  }

  static async updateReminder(userId: string, reminderId: string, data: any) {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    );
    if (!reminder) {
      throw { status: 404, code: 'REMINDER_NOT_FOUND', message: 'Reminder not found' };
    }
    return reminder;
  }

  static async deleteReminder(userId: string, reminderId: string) {
    const reminder = await Reminder.findOneAndDelete({
      _id: reminderId,
      userId: new Types.ObjectId(userId)
    });
    if (!reminder) {
      throw { status: 404, code: 'REMINDER_NOT_FOUND', message: 'Reminder not found' };
    }
    return { success: true };
  }

  /**
   * Background runner for local fallback scheduler
   * Checks for queued reminders that are due
   */
  static async processDueReminders() {
    try {
      const now = new Date();
      const dueReminders = await Reminder.find({
        status: ReminderStatus.QUEUED,
        scheduledAt: { $lte: now }
      }).limit(50);

      for (const reminder of dueReminders) {
        try {
          // Deliver notification
          await NotificationService.createNotification({
            userId: reminder.userId,
            type: reminder.reminderType,
            title: reminder.title,
            body: reminder.body || `Reminder for your scheduled task.`,
            relatedResourceType: 'Task',
            relatedResourceId: reminder.taskId || undefined
          });

          reminder.status = ReminderStatus.SENT;
          reminder.sentAt = new Date();
          await reminder.save();
        } catch (err: any) {
          logger.error('Failed to dispatch reminder', { reminderId: reminder._id, error: err.message });
          reminder.status = ReminderStatus.FAILED;
          reminder.failureCode = err.message;
          await reminder.save();
        }
      }
    } catch (err: any) {
      logger.error('Error running processDueReminders cycle', { error: err.message });
    }
  }

  static startScheduler(intervalMs = 30000) {
    if (reminderInterval) return;
    logger.info(`Starting reminder scheduler background worker (${intervalMs}ms interval)`);
    reminderInterval = setInterval(() => {
      ReminderService.processDueReminders().catch(() => {});
    }, intervalMs);
  }

  static stopScheduler() {
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
  }
}

