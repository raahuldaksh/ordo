import { Types } from 'mongoose';
import { Task, TaskOutcome } from '../models/index.js';
import { TaskStatus, TaskType, TaskPriority, ReasonCategory } from '../constants/enums.js';

export class TaskService {
  static async listTasks(userId: string, filters: {
    date?: string;
    from?: string;
    to?: string;
    status?: TaskStatus;
    taskType?: TaskType;
    priority?: TaskPriority;
    search?: string;
    includeArchived?: boolean;
    unscheduledOnly?: boolean;
  }) {
    // Strictly isolate by authenticated userId (PRD §6 & §8)
    const query: any = { userId: new Types.ObjectId(userId) };

    if (!filters.includeArchived) {
      query.archivedAt = null;
    }

    if (filters.unscheduledOnly) {
      query.scheduledStartAt = null;
    } else if (filters.date && typeof filters.date === 'string') {
      const start = new Date(`${filters.date}T00:00:00.000Z`);
      const end = new Date(`${filters.date}T23:59:59.999Z`);
      query.scheduledStartAt = { $gte: start, $lte: end };
    } else if (filters.from || filters.to) {
      query.scheduledStartAt = {};
      if (filters.from && typeof filters.from === 'string') query.scheduledStartAt.$gte = new Date(filters.from);
      if (filters.to && typeof filters.to === 'string') query.scheduledStartAt.$lte = new Date(filters.to);
    }

    if (filters.status && Object.values(TaskStatus).includes(filters.status)) {
      query.status = filters.status;
    }
    if (filters.taskType && Object.values(TaskType).includes(filters.taskType)) {
      query.taskType = filters.taskType;
    }
    if (filters.priority && Object.values(TaskPriority).includes(filters.priority)) {
      query.priority = filters.priority;
    }
    if (filters.search && typeof filters.search === 'string') {
      const safeSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } }
      ];
    }

    return Task.find(query).sort({ scheduledStartAt: 1, createdAt: 1 });
  }

  static async getTaskById(userId: string, taskId: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    return task;
  }

  static async createTask(userId: string, data: any) {
    // Validate time range
    if (data.scheduledStartAt && data.scheduledEndAt) {
      if (new Date(data.scheduledEndAt) <= new Date(data.scheduledStartAt)) {
        throw { status: 400, code: 'INVALID_TIME_RANGE', message: 'scheduledEndAt must be later than scheduledStartAt' };
      }
    }

    // Mass-assignment defense: only allowlisted properties (PRD §7)
    const task = await Task.create({
      userId: new Types.ObjectId(userId),
      title: String(data.title || '').trim(),
      description: data.description ? String(data.description).trim() : '',
      taskType: Object.values(TaskType).includes(data.taskType) ? data.taskType : TaskType.FLEXIBLE,
      priority: Object.values(TaskPriority).includes(data.priority) ? data.priority : TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt) : null,
      scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : null,
      durationMinutes: typeof data.durationMinutes === 'number' ? Math.max(5, Math.min(1440, data.durationMinutes)) : 30,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      timezone: data.timezone ? String(data.timezone).trim() : 'UTC',
      tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).trim().substring(0, 30)).filter(Boolean) : []
    });

    return task;
  }

  static async updateTask(userId: string, taskId: string, updates: any) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }

    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    const startAt = updates.scheduledStartAt !== undefined ? updates.scheduledStartAt : task.scheduledStartAt;
    const endAt = updates.scheduledEndAt !== undefined ? updates.scheduledEndAt : task.scheduledEndAt;

    if (startAt && endAt) {
      if (new Date(endAt) <= new Date(startAt)) {
        throw { status: 400, code: 'INVALID_TIME_RANGE', message: 'scheduledEndAt must be later than scheduledStartAt' };
      }
    }

    // Mass assignment prevention: explicit field mutations only
    if (updates.title !== undefined) task.title = String(updates.title).trim();
    if (updates.description !== undefined) task.description = String(updates.description).trim();
    if (updates.taskType !== undefined && Object.values(TaskType).includes(updates.taskType)) task.taskType = updates.taskType;
    if (updates.priority !== undefined && Object.values(TaskPriority).includes(updates.priority)) task.priority = updates.priority;
    if (updates.durationMinutes !== undefined) task.durationMinutes = Number(updates.durationMinutes);
    if (updates.timezone !== undefined) task.timezone = String(updates.timezone);
    if (updates.tags !== undefined && Array.isArray(updates.tags)) {
      task.tags = updates.tags.map((t: any) => String(t).trim().substring(0, 30)).filter(Boolean);
    }

    if (updates.scheduledStartAt !== undefined) {
      task.scheduledStartAt = updates.scheduledStartAt ? new Date(updates.scheduledStartAt) : null;
    }
    if (updates.scheduledEndAt !== undefined) {
      task.scheduledEndAt = updates.scheduledEndAt ? new Date(updates.scheduledEndAt) : null;
    }
    if (updates.dueAt !== undefined) {
      task.dueAt = updates.dueAt ? new Date(updates.dueAt) : null;
    }

    await task.save();
    return task;
  }

  static async deleteTask(userId: string, taskId: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const result = await Task.findOneAndDelete({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!result) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    // Also clean up outcomes
    await TaskOutcome.deleteMany({ taskId: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    return { success: true };
  }

  static async archiveTask(userId: string, taskId: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    task.archivedAt = task.archivedAt ? null : new Date();
    await task.save();
    return task;
  }

  static async duplicateTask(userId: string, taskId: string, targetDate?: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const original = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!original) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    let newStartAt = null;
    let newEndAt = null;

    if (targetDate && original.scheduledStartAt && original.scheduledEndAt) {
      const origStart = new Date(original.scheduledStartAt);
      const origEnd = new Date(original.scheduledEndAt);
      const target = new Date(targetDate);

      newStartAt = new Date(target.getFullYear(), target.getMonth(), target.getDate(), origStart.getHours(), origStart.getMinutes());
      newEndAt = new Date(target.getFullYear(), target.getMonth(), target.getDate(), origEnd.getHours(), origEnd.getMinutes());
    }

    const duplicate = await Task.create({
      userId: original.userId,
      title: `${original.title} (Copy)`.substring(0, 200),
      description: original.description,
      taskType: original.taskType,
      priority: original.priority,
      status: TaskStatus.PENDING,
      scheduledStartAt: newStartAt,
      scheduledEndAt: newEndAt,
      durationMinutes: original.durationMinutes,
      timezone: original.timezone,
      tags: original.tags
    });

    return duplicate;
  }

  static async rescheduleTask(userId: string, taskId: string, startAt: string, endAt: string, durationMinutes?: number) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (endDate <= startDate) {
      throw { status: 400, code: 'INVALID_TIME_RANGE', message: 'scheduledEndAt must be later than scheduledStartAt' };
    }

    task.scheduledStartAt = startDate;
    task.scheduledEndAt = endDate;
    if (durationMinutes) {
      task.durationMinutes = durationMinutes;
    } else {
      task.durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    }

    await task.save();
    return task;
  }

  static async updateStatus(userId: string, taskId: string, data: {
    status: TaskStatus;
    reasonCategory?: ReasonCategory | null;
    actualReason?: string | null;
    actualStartedAt?: string | null;
    actualEndedAt?: string | null;
    actualDurationMinutes?: number | null;
    note?: string | null;
  }) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    const previousStatus = task.status;
    task.status = data.status;

    // Reason tracking for FAILED and HALF (PRD §8.4)
    if (data.status === TaskStatus.FAILED || data.status === TaskStatus.HALF) {
      task.reasonCategory = data.reasonCategory || null;
      task.actualReason = data.actualReason ? String(data.actualReason).substring(0, 1000) : null;
    } else {
      task.reasonCategory = null;
      task.actualReason = null;
    }

    await task.save();

    // Append-only history record in taskOutcomes matching PRD §9.4 & §11.9
    const outcome = await TaskOutcome.create({
      userId: new Types.ObjectId(userId),
      taskId: task._id,
      previousStatus,
      newStatus: data.status,
      reasonCategory: data.reasonCategory || null,
      actualReason: data.actualReason ? String(data.actualReason).substring(0, 1000) : null,
      actualStartedAt: data.actualStartedAt ? new Date(data.actualStartedAt) : null,
      actualEndedAt: data.actualEndedAt ? new Date(data.actualEndedAt) : null,
      actualDurationMinutes: data.actualDurationMinutes || null,
      note: data.note ? String(data.note).substring(0, 500) : null,
      occurredAt: new Date()
    });

    return { task, outcome };
  }

  static async getTaskOutcomes(userId: string, taskId: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid task identifier' };
    }
    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    return TaskOutcome.find({ taskId: task._id, userId: new Types.ObjectId(userId) }).sort({ occurredAt: -1 });
  }
}
