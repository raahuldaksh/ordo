import mongoose, { Document, Schema, Types } from 'mongoose';
import { RoutineTemplateType } from '../constants/enums.js';

export interface IRoutineTemplate extends Document {
  userId: Types.ObjectId;
  name: string;
  templateType: RoutineTemplateType;
  description?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const routineTemplateSchema = new Schema<IRoutineTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    templateType: {
      type: String,
      enum: Object.values(RoutineTemplateType),
      default: RoutineTemplateType.DAILY,
      required: true
    },
    description: { type: String, default: '', trim: true },
    timezone: { type: String, default: 'UTC' }
  },
  {
    timestamps: true
  }
);

routineTemplateSchema.index({ userId: 1, templateType: 1 });

export const RoutineTemplate = mongoose.model<IRoutineTemplate>('RoutineTemplate', routineTemplateSchema);

