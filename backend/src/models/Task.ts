import mongoose, { Document, Schema, Types } from 'mongoose';
import { TaskPriority, TaskStatus, TaskType, ReasonCategory } from '../constants/enums.js';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  scheduledStartAt?: Date | null;
  scheduledEndAt?: Date | null;
  durationMinutes: number;
  dueAt?: Date | null;
  timezone: string;
  recurrenceRule?: string | null;
  reasonCategory?: ReasonCategory | null;
  actualReason?: string | null;
  tags: string[];
  sourceTemplateId?: Types.ObjectId | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    taskType: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.FLEXIBLE,
      required: true
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      required: true
    },
    scheduledStartAt: { type: Date, default: null },
    scheduledEndAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: 30 },
    dueAt: { type: Date, default: null },
    timezone: { type: String, default: 'UTC' },
    recurrenceRule: { type: String, default: null },
    reasonCategory: {
      type: String,
      enum: [...Object.values(ReasonCategory), null],
      default: null
    },
    actualReason: { type: String, default: null },
    tags: { type: [String], default: [] },
    sourceTemplateId: { type: Schema.Types.ObjectId, ref: 'RoutineTemplate', default: null },
    archivedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

// Indexes specified in PRD §9.13
taskSchema.index({ userId: 1, scheduledStartAt: 1 });
taskSchema.index({ userId: 1, status: 1, scheduledStartAt: 1 });
taskSchema.index({ userId: 1, taskType: 1, scheduledStartAt: 1 });
taskSchema.index({ userId: 1, archivedAt: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);

