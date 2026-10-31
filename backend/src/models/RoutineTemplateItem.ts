import mongoose, { Document, Schema, Types } from 'mongoose';
import { TaskPriority, TaskType } from '../constants/enums.js';

export interface IRoutineTemplateItem extends Document {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  dayOfWeek?: number | null; // 0=Sunday to 6=Saturday for weekly templates
  startTimeLocal: string; // HH:mm
  endTimeLocal: string; // HH:mm
  durationMinutes: number;
  recurrenceRule?: string | null;
  sortOrder: number;
}

const routineTemplateItemSchema = new Schema<IRoutineTemplateItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'RoutineTemplate', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    taskType: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.FIXED,
      required: true
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true
    },
    dayOfWeek: { type: Number, default: null },
    startTimeLocal: { type: String, required: true },
    endTimeLocal: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    recurrenceRule: { type: String, default: null },
    sortOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

routineTemplateItemSchema.index({ templateId: 1, sortOrder: 1 });

export const RoutineTemplateItem = mongoose.model<IRoutineTemplateItem>('RoutineTemplateItem', routineTemplateItemSchema);

