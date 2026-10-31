import { Types } from 'mongoose';
import { Task } from '../models/index.js';
import { TaskStatus, TaskType } from '../constants/enums.js';

export class PlannerService {
  static async getDaySchedule(userId: string, dateStr: string) {
    const userObjectId = new Types.ObjectId(userId);
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    // Fetch scheduled tasks on this day
    const scheduledTasks = await Task.find({
      userId: userObjectId,
      archivedAt: null,
      scheduledStartAt: { $gte: dayStart, $lte: dayEnd }
    }).sort({ scheduledStartAt: 1 });

    // Fetch unscheduled tasks queue
    const unscheduledTasks = await Task.find({
      userId: userObjectId,
      archivedAt: null,
      scheduledStartAt: null
    }).sort({ createdAt: -1 });

    // Compute day metrics
    const totalScheduled = scheduledTasks.length;
    const successCount = scheduledTasks.filter(t => t.status === TaskStatus.SUCCESS).length;
    const pendingCount = scheduledTasks.filter(t => t.status === TaskStatus.PENDING).length;
    const failedCount = scheduledTasks.filter(t => t.status === TaskStatus.FAILED).length;
    const halfCount = scheduledTasks.filter(t => t.status === TaskStatus.HALF).length;

    // Completion rate = Success / eligible planned tasks (Half reported separately)
    const completionRate = totalScheduled > 0 ? Math.round((successCount / totalScheduled) * 100) : 0;

    // Total planned duration in minutes
    const plannedMinutes = scheduledTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

    return {
      date: dateStr,
      metrics: {
        totalScheduled,
        successCount,
        pendingCount,
        failedCount,
        halfCount,
        completionRate,
        plannedMinutes
      },
      scheduled: {
        fixed: scheduledTasks.filter(t => t.taskType === TaskType.FIXED),
        flexible: scheduledTasks.filter(t => t.taskType === TaskType.FLEXIBLE),
        unplanned: scheduledTasks.filter(t => t.taskType === TaskType.UNPLANNED)
      },
      allScheduled: scheduledTasks,
      unscheduled: unscheduledTasks
    };
  }

  static async getRangeSchedule(userId: string, from: string, to: string) {
    const userObjectId = new Types.ObjectId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const tasks = await Task.find({
      userId: userObjectId,
      archivedAt: null,
      scheduledStartAt: { $gte: fromDate, $lte: toDate }
    }).sort({ scheduledStartAt: 1 });

    return tasks;
  }

  static async checkOverlaps(userId: string, startAt: string, endAt: string, excludeTaskId?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const newStart = new Date(startAt);
    const newEnd = new Date(endAt);

    const query: any = {
      userId: userObjectId,
      archivedAt: null,
      scheduledStartAt: { $lt: newEnd },
      scheduledEndAt: { $gt: newStart }
    };

    if (excludeTaskId) {
      query._id = { $ne: new Types.ObjectId(excludeTaskId) };
    }

    const overlappingTasks = await Task.find(query).select('title taskType priority status scheduledStartAt scheduledEndAt');

    return {
      hasOverlap: overlappingTasks.length > 0,
      overlapsCount: overlappingTasks.length,
      conflicts: overlappingTasks
    };
  }
}

