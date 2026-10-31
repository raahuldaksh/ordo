import mongoose, { Document, Schema, Types } from 'mongoose';
import { CalendarProvider, CalendarSyncMode } from '../constants/enums.js';

export interface ICalendarConnection extends Document {
  userId: Types.ObjectId;
  provider: CalendarProvider;
  providerAccountId: string;
  encryptedAccessToken?: string | null;
  encryptedRefreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  syncMode: CalendarSyncMode;
  connectionStatus: 'CONNECTED' | 'REVOKED' | 'EXPIRED';
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const calendarConnectionSchema = new Schema<ICalendarConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: Object.values(CalendarProvider),
      default: CalendarProvider.GOOGLE,
      required: true
    },
    providerAccountId: { type: String, required: true },
    encryptedAccessToken: { type: String, default: null },
    encryptedRefreshToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
    syncMode: {
      type: String,
      enum: Object.values(CalendarSyncMode),
      default: CalendarSyncMode.IMPORT,
      required: true
    },
    connectionStatus: {
      type: String,
      enum: ['CONNECTED', 'REVOKED', 'EXPIRED'],
      default: 'CONNECTED'
    },
    lastSyncedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

calendarConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const CalendarConnection = mongoose.model<ICalendarConnection>('CalendarConnection', calendarConnectionSchema);

