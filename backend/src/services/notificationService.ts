import { Types } from 'mongoose';
import { Notification } from '../models/index.js';

export class NotificationService {
  static async listNotifications(userId: string) {
    return Notification.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(50);
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      throw { status: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' };
    }
    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { userId: new Types.ObjectId(userId), readAt: null },
      { $set: { readAt: new Date() } }
    );
    return { success: true };
  }

  static async createNotification(data: {
    userId: string | Types.ObjectId;
    type: string;
    title: string;
    body: string;
    relatedResourceType?: string;
    relatedResourceId?: Types.ObjectId;
  }) {
    return Notification.create({
      userId: typeof data.userId === 'string' ? new Types.ObjectId(data.userId) : data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      relatedResourceType: data.relatedResourceType,
      relatedResourceId: data.relatedResourceId
    });
  }
}

