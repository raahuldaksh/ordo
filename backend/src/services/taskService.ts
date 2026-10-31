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
    const query: any = { userId: new Types.ObjectId(userId) };

    if (!filters.includeArchived) {
      query.archivedAt = null;
    }

    if (filters.unscheduledOnly) {
      query.scheduledStartAt = null;
    } else if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00.000Z`);
      const end = new Date(`${filters.date}T23:59:59.999Z`);
      query.scheduledStartAt = { $gte: start, $lte: end };
    } else if (filters.from || filters.to) {
      query.scheduledStartAt = {};
      if (filters.from) query.scheduledStartAt.$gte = new Date(filters.from);
      if (filters.to) query.scheduledStartAt.$lte = new Date(filters.to);
    }

    if (filters.status) query.status = filters.status;
    if (filters.taskType) query.taskType = filters.taskType;
    if (filters.priority) query.priority = filters.priority;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    return Task.find(query).sort({ scheduledStartAt: 1, createdAt: 1 });
  }

  static async getTaskById(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    return task;
  }

  static async createTask(userId: string, data: any) {
    if (data.scheduledStartAt && data.scheduledEndAt) {
      if (new Date(data.scheduledEndAt) <= new Date(data.scheduledStartAt)) {
        throw { status: 400, code: 'INVALID_TIME_RANGE', message: 'scheduledEndAt must be later than scheduledStartAt' };
      }
    }

    const task = await Task.create({
      ...data,
      userId: new Types.ObjectId(userId),
      scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt) : null,
      scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null
    });

    return task;
  }

  static async updateTask(userId: string, taskId: string, updates: any) {
    const task = await Task.findOne({ _id: taskId, userId });
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

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.taskType !== undefined) task.taskType = updates.taskType;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.durationMinutes !== undefined) task.durationMinutes = updates.durationMinutes;
    if (updates.timezone !== undefined) task.timezone = updates.timezone;
    if (updates.recurrenceRule !== undefined) task.recurrenceRule = updates.recurrenceRule;
    if (updates.tags !== undefined) task.tags = updates.tags;

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
    const result = await Task.findOneAndDelete({ _id: taskId, userId });
    if (!result) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    // Also clean up outcomes
    await TaskOutcome.deleteMany({ taskId, userId });
    return { success: true };
  }

  static async archiveTask(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }
    task.archivedAt = task.archivedAt ? null : new Date();
    await task.save();
    return task;
  }

  static async duplicateTask(userId: string, taskId: string, targetDate?: string) {
    const original = await Task.findOne({ _id: taskId, userId });
    if (!original) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    let newStartAt = original.scheduledStartAt;
    let newEndAt = original.scheduledEndAt;

    if (targetDate && original.scheduledStartAt && original.scheduledEndAt) {
      const origStart = new Date(original.scheduledStartAt);
      const origEnd = new Date(original.scheduledEndAt);
      const target = new Date(targetDate);

      newStartAt = new Date(target.getFullYear(), target.getMonth(), target.getDate(), origStart.getHours(), origStart.getMinutes());
      newEndAt = new Date(target.getFullYear(), target.getMonth(), target.getDate(), origEnd.getHours(), origEnd.getMinutes());
    }

    const duplicate = await Task.create({
      userId: original.userId,
      title: `${original.title} (Copy)`,
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
    const task = await Task.findOne({ _id: taskId, userId });
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
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    const previousStatus = task.status;
    task.status = data.status;
    task.reasonCategory = data.reasonCategory !== undefined ? data.reasonCategory : task.reasonCategory;
    task.actualReason = data.actualReason !== undefined ? data.actualReason : task.actualReason;

    await task.save();

    // Append-only history record in taskOutcomes matching PRD §9.4 & §11.9
    const outcome = await TaskOutcome.create({
      userId: new Types.ObjectId(userId),
      taskId: task._id,
      previousStatus,
      newStatus: data.status,
      reasonCategory: data.reasonCategory || null,
      actualReason: data.actualReason || null,
      actualStartedAt: data.actualStartedAt ? new Date(data.actualStartedAt) : null,
      actualEndedAt: data.actualEndedAt ? new Date(data.actualEndedAt) : null,
      actualDurationMinutes: data.actualDurationMinutes || null,
      note: data.note || null,
      occurredAt: new Date()
    });

    return { task, outcome };
  }

  static async getTaskOutcomes(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw { status: 404, code: 'TASK_NOT_FOUND', message: 'Task not found or unauthorized' };
    }

    return TaskOutcome.find({ taskId, userId }).sort({ occurredAt: -1 });
  }
}

