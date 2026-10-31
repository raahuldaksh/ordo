import mongoose, { Document, Schema, Types } from 'mongoose';
import { TaskStatus, ReasonCategory } from '../constants/enums.js';

export interface ITaskOutcome extends Document {
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  reasonCategory?: ReasonCategory | null;
  actualReason?: string | null;
  actualStartedAt?: Date | null;
  actualEndedAt?: Date | null;
  actualDurationMinutes?: number | null;
  note?: string | null;
  occurredAt: Date;
  createdAt: Date;
}

const taskOutcomeSchema = new Schema<ITaskOutcome>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    previousStatus: {
      type: String,
      enum: Object.values(TaskStatus),
      required: true
    },
    newStatus: {
      type: String,
      enum: Object.values(TaskStatus),
      required: true
    },
    reasonCategory: {
      type: String,
      enum: [...Object.values(ReasonCategory), null],
      default: null
    },
    actualReason: { type: String, default: null },
    actualStartedAt: { type: Date, default: null },
    actualEndedAt: { type: Date, default: null },
    actualDurationMinutes: { type: Number, default: null },
    note: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

taskOutcomeSchema.index({ userId: 1, occurredAt: -1 });

export const TaskOutcome = mongoose.model<ITaskOutcome>('TaskOutcome', taskOutcomeSchema);

