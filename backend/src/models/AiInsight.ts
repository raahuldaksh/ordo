import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAiInsight extends Document {
  userId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  insightType: 'WEEKLY_REFLECTION' | 'OVERLOAD_WARNING' | 'SCHEDULE_OPTIMIZATION';
  content: {
    title: string;
    summary: string;
    observations: string[];
    recommendations: string[];
    suggestedRoutineChanges?: Array<{
      action: 'ADD' | 'MODIFY' | 'REMOVE';
      title: string;
      timeSlot?: string;
      reason: string;
    }>;
  };
  sourceMetrics: {
    completionRate: number;
    failedTasksCount: number;
    dominantReason?: string;
    plannedVsActualHoursDiff?: number;
  };
  feedback?: 'HELPFUL' | 'UNHELPFUL' | null;
  createdAt: Date;
}

const aiInsightSchema = new Schema<IAiInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    insightType: {
      type: String,
      enum: ['WEEKLY_REFLECTION', 'OVERLOAD_WARNING', 'SCHEDULE_OPTIMIZATION'],
      default: 'WEEKLY_REFLECTION',
      required: true
    },
    content: {
      title: { type: String, required: true },
      summary: { type: String, required: true },
      observations: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      suggestedRoutineChanges: {
        type: [
          {
            action: { type: String, enum: ['ADD', 'MODIFY', 'REMOVE'] },
            title: String,
            timeSlot: String,
            reason: String
          }
        ],
        default: []
      }
    },
    sourceMetrics: {
      completionRate: { type: Number, default: 0 },
      failedTasksCount: { type: Number, default: 0 },
      dominantReason: { type: String, default: null },
      plannedVsActualHoursDiff: { type: Number, default: 0 }
    },
    feedback: {
      type: String,
      enum: ['HELPFUL', 'UNHELPFUL', null],
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

aiInsightSchema.index({ userId: 1, createdAt: -1 });

export const AiInsight = mongoose.model<IAiInsight>('AiInsight', aiInsightSchema);

