import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWeeklyReview extends Document {
  userId: Types.ObjectId;
  weekStartDate: Date;
  weekEndDate: Date;
  wins: string;
  challenges: string;
  recurringReasons: string[];
  nextWeekChanges: string;
  summarySnapshot: {
    totalPlannedTasks: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
    halfCount: number;
    completionRate: number;
    topReasons: Array<{ reason: string; count: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const weeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    wins: { type: String, default: '', trim: true },
    challenges: { type: String, default: '', trim: true },
    recurringReasons: { type: [String], default: [] },
    nextWeekChanges: { type: String, default: '', trim: true },
    summarySnapshot: {
      totalPlannedTasks: { type: Number, default: 0 },
      successCount: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      halfCount: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      topReasons: { type: [{ reason: String, count: Number }], default: [] }
    }
  },
  {
    timestamps: true
  }
);

weeklyReviewSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

export const WeeklyReview = mongoose.model<IWeeklyReview>('WeeklyReview', weeklyReviewSchema);

