import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { WeeklyReview } from '../models/index.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class WeeklyReviewController {
  static async listReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reviews = await WeeklyReview.find({ userId: new Types.ObjectId(req.user!.userId) }).sort({ weekStartDate: -1 });
      sendSuccess(res, reviews);
    } catch (err: any) {
      sendError(res, err.code || 'LIST_REVIEWS_FAILED', err.message, err.status || 400);
    }
  }

  static async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { weekStartDate, weekEndDate, wins, challenges, recurringReasons, nextWeekChanges } = req.body;
      const userObjectId = new Types.ObjectId(req.user!.userId);

      // Snapshot the analytics for this period matching PRD §9.11
      const summary = await AnalyticsService.getSummary(req.user!.userId, weekStartDate, weekEndDate);
      const reasons = await AnalyticsService.getReasons(req.user!.userId, weekStartDate, weekEndDate);

      const summarySnapshot = {
        totalPlannedTasks: summary.totalPlanned,
        successCount: summary.successCount,
        pendingCount: summary.pendingCount,
        failedCount: summary.failedCount,
        halfCount: summary.halfCount,
        completionRate: summary.completionRate ?? 0,
        topReasons: reasons.categoryBreakdown.slice(0, 5).map(r => ({ reason: r.category, count: r.count }))
      };

      const review = await WeeklyReview.findOneAndUpdate(
        { userId: userObjectId, weekStartDate: new Date(weekStartDate) },
        {
          userId: userObjectId,
          weekStartDate: new Date(weekStartDate),
          weekEndDate: new Date(weekEndDate),
          wins: wins || '',
          challenges: challenges || '',
          recurringReasons: recurringReasons || [],
          nextWeekChanges: nextWeekChanges || '',
          summarySnapshot
        },
        { upsert: true, new: true }
      );

      sendSuccess(res, review, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'CREATE_REVIEW_FAILED', err.message, err.status || 400);
    }
  }

  static async getReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const review = await WeeklyReview.findOne({
        _id: req.params.reviewId as string,
        userId: new Types.ObjectId(req.user!.userId)
      });
      if (!review) {
        sendError(res, 'REVIEW_NOT_FOUND', 'Weekly review not found', 404);
        return;
      }
      sendSuccess(res, review);
    } catch (err: any) {
      sendError(res, err.code || 'GET_REVIEW_FAILED', err.message, err.status || 400);
    }
  }

  static async updateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const review = await WeeklyReview.findOneAndUpdate(
        { _id: req.params.reviewId as string, userId: new Types.ObjectId(req.user!.userId) },
        { $set: req.body },
        { new: true }
      );
      if (!review) {
        sendError(res, 'REVIEW_NOT_FOUND', 'Weekly review not found', 404);
        return;
      }
      sendSuccess(res, review);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_REVIEW_FAILED', err.message, err.status || 400);
    }
  }
}
