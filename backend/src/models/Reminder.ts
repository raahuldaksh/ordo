import mongoose, { Document, Schema, Types } from 'mongoose';
import { ReminderChannel, ReminderStatus, ReminderType } from '../constants/enums.js';

export interface IReminder extends Document {
  userId: Types.ObjectId;
  taskId?: Types.ObjectId | null;
  reminderType: ReminderType;
  scheduledAt: Date;
  timezone: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  idempotencyKey?: string | null;
  sentAt?: Date | null;
  failureCode?: string | null;
  title: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    reminderType: {
      type: String,
      enum: Object.values(ReminderType),
      default: ReminderType.TASK_START,
      required: true
    },
    scheduledAt: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    channel: {
      type: String,
      enum: Object.values(ReminderChannel),
      default: ReminderChannel.IN_APP,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ReminderStatus),
      default: ReminderStatus.QUEUED,
      required: true
    },
    idempotencyKey: { type: String, default: null, sparse: true, unique: true },
    sentAt: { type: Date, default: null },
    failureCode: { type: String, default: null },
    title: { type: String, required: true },
    body: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

reminderSchema.index({ status: 1, scheduledAt: 1 });
reminderSchema.index({ userId: 1, scheduledAt: 1 });

export const Reminder = mongoose.model<IReminder>('Reminder', reminderSchema);

