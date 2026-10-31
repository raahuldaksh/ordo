import { Types } from 'mongoose';
import { AiInsight } from '../models/index.js';
import { AnalyticsService } from './analyticsService.js';
import { config } from '../config/env.js';

export class AiService {
  static async generateInsights(userId: string, periodStart: string, periodEnd: string, userConsent = true) {
    if (!userConsent) {
      throw { status: 400, code: 'CONSENT_REQUIRED', message: 'User consent is required before generating AI analysis.' };
    }

    const summary = await AnalyticsService.getSummary(userId, periodStart, periodEnd);
    const reasons = await AnalyticsService.getReasons(userId, periodStart, periodEnd);

    const dominantReason = reasons.categoryBreakdown.length > 0 ? reasons.categoryBreakdown[0].category : 'None';
    const completionRate = summary.completionRate ?? 0;

    // Generate intelligent coaching insights based on metrics
    const observations: string[] = [];
    const recommendations: string[] = [];
    const suggestedRoutineChanges: any[] = [];

    if (completionRate >= 80) {
      observations.push(`Exceptional execution! You achieved an ${completionRate}% completion rate across ${summary.totalPlanned} planned tasks.`);
      recommendations.push(`Maintain this sustainable momentum. Keep buffer times between high-intensity blocks.`);
    } else if (completionRate >= 50) {
      observations.push(`Solid progress with an ${completionRate}% completion rate. You finished ${summary.successCount} tasks out of ${summary.totalPlanned}.`);
      recommendations.push(`Review the ${summary.failedCount} missed tasks. Consider reducing daily commitments by 1-2 flexible tasks to prevent schedule drift.`);
    } else {
      observations.push(`Completion rate was ${completionRate}%. It appears the planned schedule was heavily overloaded relative to available hours.`);
      recommendations.push(`Adopt conservative planning: schedule no more than 3 high-priority tasks per day.`);
    }

    if (dominantReason !== 'None') {
      observations.push(`Your most frequent obstacle was "${dominantReason.replace('_', ' ')}", recorded ${reasons.categoryBreakdown[0].count} times.`);
      if (dominantReason === 'DISTRACTION') {
        recommendations.push(`Implement 25-minute Pomodoro sessions with notifications silenced during Flexible deep work blocks.`);
      } else if (dominantReason === 'LOW_ENERGY') {
        recommendations.push(`Shift demanding tasks to morning slots (09:00 - 11:30) and leave evenings for lighter administrative tasks.`);
      } else if (dominantReason === 'POOR_PLANNING' || dominantReason === 'TIME_MISMANAGEMENT') {
        recommendations.push(`Add a mandatory 15-minute buffer between back-to-back commitments.`);
      } else {
        recommendations.push(`Reflect on external interruptions and categorize unexpected tasks as UNPLANNED to track drift.`);
      }
    }

    // Suggested routine adjustments
    suggestedRoutineChanges.push({
      action: 'ADD',
      title: 'Daily Review & Shutdown',
      timeSlot: '21:30 - 21:50',
      reason: 'A structured 20-minute daily review reduces next-day planning friction by 40%.'
    });

    const title = completionRate >= 75 ? 'Weekly Execution Analysis: Strong Alignment' : 'Weekly Execution Analysis: Schedule Recalibration';
    const summaryText = `Over the past week, you planned ${summary.totalPlanned} tasks (${summary.plannedHours} hrs). You achieved ${summary.successCount} successes, while ${summary.failedCount} were marked failed. Primary friction source: ${dominantReason.replace('_', ' ')}.`;

    const insight = await AiInsight.create({
      userId: new Types.ObjectId(userId),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      insightType: 'WEEKLY_REFLECTION',
      content: {
        title,
        summary: summaryText,
        observations,
        recommendations,
        suggestedRoutineChanges
      },
      sourceMetrics: {
        completionRate,
        failedTasksCount: summary.failedCount,
        dominantReason
      }
    });

    return insight;
  }

  static async listInsights(userId: string) {
    return AiInsight.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  static async recordFeedback(userId: string, insightId: string, feedback: 'HELPFUL' | 'UNHELPFUL') {
    const insight = await AiInsight.findOneAndUpdate(
      { _id: insightId, userId: new Types.ObjectId(userId) },
      { $set: { feedback } },
      { new: true }
    );
    if (!insight) {
      throw { status: 404, code: 'INSIGHT_NOT_FOUND', message: 'Insight not found' };
    }
    return insight;
  }

  static async deleteInsight(userId: string, insightId: string) {
    const result = await AiInsight.findOneAndDelete({
      _id: insightId,
      userId: new Types.ObjectId(userId)
    });
    if (!result) {
      throw { status: 404, code: 'INSIGHT_NOT_FOUND', message: 'Insight not found' };
    }
    return { success: true };
  }
}

