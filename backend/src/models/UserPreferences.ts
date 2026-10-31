import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: Types.ObjectId;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  locale: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  defaultTaskDurationMinutes: number;
  wakeTimeLocal: string; // HH:mm
  sleepTimeLocal: string; // HH:mm
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  notificationPreferences: {
    taskStart: boolean;
    taskDeadline: boolean;
    dailyPlanning: boolean;
    dailyReview: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone: { type: String, default: 'UTC' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    locale: { type: String, default: 'en-US' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
    weekStartsOn: { type: Number, enum: [0, 1], default: 1 },
    defaultTaskDurationMinutes: { type: Number, default: 30 },
    wakeTimeLocal: { type: String, default: '07:00' },
    sleepTimeLocal: { type: String, default: '23:00' },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '07:00' }
    },
    notificationPreferences: {
      taskStart: { type: Boolean, default: true },
      taskDeadline: { type: Boolean, default: true },
      dailyPlanning: { type: Boolean, default: true },
      dailyReview: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', userPreferencesSchema);
