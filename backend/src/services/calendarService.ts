import { Types } from 'mongoose';
import { CalendarConnection, CalendarEvent, Task } from '../models/index.js';
import { CalendarProvider, CalendarSyncMode, CalendarEventSource } from '../constants/enums.js';
import { encryptToken } from '../utils/crypto.js';

export class CalendarService {
  static async getEvents(userId: string, fromStr?: string, toStr?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const dateQuery: any = {};
    if (fromStr) dateQuery.$gte = new Date(fromStr);
    if (toStr) dateQuery.$lte = new Date(toStr);

    const taskQuery: any = {
      userId: userObjectId,
      archivedAt: null,
      scheduledStartAt: { $ne: null }
    };
    if (fromStr || toStr) {
      taskQuery.scheduledStartAt = dateQuery;
    }

    const ordoTasks = await Task.find(taskQuery).sort({ scheduledStartAt: 1 });

    const eventQuery: any = { userId: userObjectId };
    if (fromStr || toStr) {
      eventQuery.startAt = dateQuery;
    }
    const externalEvents = await CalendarEvent.find(eventQuery).sort({ startAt: 1 });

    const unifiedEvents = [
      ...ordoTasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        start: t.scheduledStartAt,
        end: t.scheduledEndAt,
        source: 'ORDO' as const,
        type: t.taskType,
        priority: t.priority,
        status: t.status,
        color: 'monochrome-ordo'
      })),
      ...externalEvents.map(e => ({
        id: e._id.toString(),
        title: e.title,
        description: e.description,
        start: e.startAt,
        end: e.endAt,
        source: e.source,
        type: 'EXTERNAL' as const,
        status: 'CONFIRMED' as const,
        color: 'monochrome-google'
      }))
    ].sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());

    return unifiedEvents;
  }

  static async getConnections(userId: string) {
    return CalendarConnection.find({ userId: new Types.ObjectId(userId) }).select('-encryptedAccessToken -encryptedRefreshToken');
  }

  static async connectGoogleCalendar(userId: string, authCode: string) {
    // Encrypt token before saving matching PRD §12
    const fakeAccessToken = encryptToken(`token_${authCode}`);
    const fakeRefreshToken = encryptToken(`refresh_${authCode}`);

    const connection = await CalendarConnection.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), provider: CalendarProvider.GOOGLE },
      {
        providerAccountId: `google-user-${userId.substring(0, 6)}`,
        encryptedAccessToken: fakeAccessToken,
        encryptedRefreshToken: fakeRefreshToken,
        tokenExpiresAt: new Date(Date.now() + 3600000),
        syncMode: CalendarSyncMode.IMPORT,
        connectionStatus: 'CONNECTED',
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return connection;
  }

  static async syncConnection(userId: string, connectionId: string) {
    const connection = await CalendarConnection.findOne({
      _id: connectionId,
      userId: new Types.ObjectId(userId)
    });

    if (!connection) {
      throw { status: 404, code: 'CONNECTION_NOT_FOUND', message: 'Calendar connection not found' };
    }

    connection.lastSyncedAt = new Date();
    await connection.save();

    return {
      success: true,
      lastSyncedAt: connection.lastSyncedAt,
      syncedEventsCount: 0
    };
  }

  static async updateConnection(userId: string, connectionId: string, updates: { syncMode?: CalendarSyncMode }) {
    const connection = await CalendarConnection.findOneAndUpdate(
      { _id: connectionId, userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    );
    if (!connection) {
      throw { status: 404, code: 'CONNECTION_NOT_FOUND', message: 'Calendar connection not found' };
    }
    return connection;
  }

  static async disconnectConnection(userId: string, connectionId: string) {
    const result = await CalendarConnection.findOneAndDelete({
      _id: connectionId,
      userId: new Types.ObjectId(userId)
    });
    if (!result) {
      throw { status: 404, code: 'CONNECTION_NOT_FOUND', message: 'Calendar connection not found' };
    }
    await CalendarEvent.deleteMany({ connectionId });
    return { success: true };
  }
}

