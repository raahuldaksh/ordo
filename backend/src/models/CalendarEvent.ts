import mongoose, { Document, Schema, Types } from 'mongoose';
import { CalendarEventSource } from '../constants/enums.js';

export interface ICalendarEvent extends Document {
  userId: Types.ObjectId;
  connectionId?: Types.ObjectId | null;
  providerEventId: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  source: CalendarEventSource;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    connectionId: { type: Schema.Types.ObjectId, ref: 'CalendarConnection', default: null },
    providerEventId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    source: {
      type: String,
      enum: Object.values(CalendarEventSource),
      default: CalendarEventSource.GOOGLE,
      required: true
    },
    syncStatus: {
      type: String,
      enum: ['SYNCED', 'PENDING', 'FAILED'],
      default: 'SYNCED'
    },
    lastSyncedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

calendarEventSchema.index({ userId: 1, providerEventId: 1 }, { unique: true });
calendarEventSchema.index({ userId: 1, startAt: 1, endAt: 1 });

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);

