import { Types } from 'mongoose';
import { Task, TaskOutcome } from '../models/index.js';
import { TaskStatus, TaskType } from '../constants/enums.js';
import { format, parseISO } from 'date-fns';

export class AnalyticsService {
  static async getSummary(userId: string, fromStr?: string, toStr?: string, groupBy = 'day') {
    const userObjectId = new Types.ObjectId(userId);
    const dateQuery: any = {};
    if (fromStr) dateQuery.$gte = new Date(fromStr);
    if (toStr) dateQuery.$lte = new Date(toStr);

    const query: any = {
      userId: userObjectId,
      archivedAt: null
    };

    if (fromStr || toStr) {
      query.scheduledStartAt = dateQuery;
    }

    const tasks = await Task.find(query).sort({ scheduledStartAt: 1 });

    const totalPlanned = tasks.length;
    const successCount = tasks.filter(t => t.status === TaskStatus.SUCCESS).length;
    const pendingCount = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const failedCount = tasks.filter(t => t.status === TaskStatus.FAILED).length;
    const halfCount = tasks.filter(t => t.status === TaskStatus.HALF).length;

    const completionRate = totalPlanned > 0 ? Number(((successCount / totalPlanned) * 100).toFixed(1)) : null;

    // Time calculations
    const plannedMinutes = tasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

    // Grouping for trend chart
    const groups: Record<string, { total: number; success: number; failed: number; half: number; pending: number }> = {};
    tasks.forEach(t => {
      const dateKey = t.scheduledStartAt ? format(new Date(t.scheduledStartAt), 'yyyy-MM-dd') : 'Unscheduled';
      if (!groups[dateKey]) {
        groups[dateKey] = { total: 0, success: 0, failed: 0, half: 0, pending: 0 };
      }
      groups[dateKey].total++;
      if (t.status === TaskStatus.SUCCESS) groups[dateKey].success++;
      if (t.status === TaskStatus.FAILED) groups[dateKey].failed++;
      if (t.status === TaskStatus.HALF) groups[dateKey].half++;
      if (t.status === TaskStatus.PENDING) groups[dateKey].pending++;
    });

    const trend = Object.entries(groups).map(([date, data]) => ({
      date,
      ...data,
      completionRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0
    }));

    // Task Type Breakdown
    const typeBreakdown = {
      fixed: tasks.filter(t => t.taskType === TaskType.FIXED).length,
      flexible: tasks.filter(t => t.taskType === TaskType.FLEXIBLE).length,
      unplanned: tasks.filter(t => t.taskType === TaskType.UNPLANNED).length
    };

    // Weekday breakdown
    const weekdayCounts = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const dayTasks = tasks.filter(t => t.scheduledStartAt && new Date(t.scheduledStartAt).getDay() === day);
      const successes = dayTasks.filter(t => t.status === TaskStatus.SUCCESS).length;
      const rate = dayTasks.length > 0 ? Math.round((successes / dayTasks.length) * 100) : 0;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        dayIndex: day,
        dayName: dayNames[day],
        total: dayTasks.length,
        successes,
        completionRate: rate
      };
    });

    return {
      totalPlanned,
      successCount,
      pendingCount,
      failedCount,
      halfCount,
      completionRate,
      plannedMinutes,
      plannedHours: Number((plannedMinutes / 60).toFixed(1)),
      trend,
      typeBreakdown,
      weekdayBreakdown: weekdayCounts
    };
  }

  static async getReasons(userId: string, fromStr?: string, toStr?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const dateQuery: any = {};
    if (fromStr) dateQuery.$gte = new Date(fromStr);
    if (toStr) dateQuery.$lte = new Date(toStr);

    const query: any = {
      userId: userObjectId,
      reasonCategory: { $ne: null }
    };
    if (fromStr || toStr) {
      query.occurredAt = dateQuery;
    }

    const outcomes = await TaskOutcome.find(query).sort({ occurredAt: -1 });

    const categoryMap: Record<string, number> = {};
    const actualReasonLogs: Array<{
      taskId: string;
      category: string;
      reason: string;
      status: string;
      date: string;
    }> = [];

    outcomes.forEach(out => {
      if (out.reasonCategory) {
        categoryMap[out.reasonCategory] = (categoryMap[out.reasonCategory] || 0) + 1;
      }
      if (out.actualReason) {
        actualReasonLogs.push({
          taskId: out.taskId.toString(),
          category: out.reasonCategory || 'OTHER',
          reason: out.actualReason,
          status: out.newStatus,
          date: out.occurredAt.toISOString()
        });
      }
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReasonRecorded: outcomes.length,
      categoryBreakdown,
      actualReasonLogs: actualReasonLogs.slice(0, 30) // top 30 logs for reflection
    };
  }
}

