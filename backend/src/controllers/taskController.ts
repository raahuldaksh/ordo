import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { TaskService } from '../services/taskService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TaskController {
  static async listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        date: req.query.date as string,
        from: req.query.from as string,
        to: req.query.to as string,
        status: req.query.status as any,
        taskType: req.query.taskType as any,
        priority: req.query.priority as any,
        search: req.query.search as string,
        includeArchived: req.query.includeArchived === 'true',
        unscheduledOnly: req.query.unscheduledOnly === 'true'
      };
      const tasks = await TaskService.listTasks(req.user!.userId, filters);
      sendSuccess(res, tasks, { count: tasks.length });
    } catch (err: any) {
      sendError(res, err.code || 'LIST_TASKS_FAILED', err.message, err.status || 400);
    }
  }

  static async getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.getTaskById(req.user!.userId, req.params.taskId as string);
      sendSuccess(res, task);
    } catch (err: any) {
      sendError(res, err.code || 'GET_TASK_FAILED', err.message, err.status || 404);
    }
  }

  static async createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.createTask(req.user!.userId, req.body);
      sendSuccess(res, task, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'CREATE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.updateTask(req.user!.userId, req.params.taskId as string, req.body);
      sendSuccess(res, task);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await TaskService.deleteTask(req.user!.userId, req.params.taskId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async archiveTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.archiveTask(req.user!.userId, req.params.taskId as string);
      sendSuccess(res, task);
    } catch (err: any) {
      sendError(res, err.code || 'ARCHIVE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async duplicateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.duplicateTask(req.user!.userId, req.params.taskId as string, req.body.targetDate);
      sendSuccess(res, task, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'DUPLICATE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async rescheduleTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const task = await TaskService.rescheduleTask(
        req.user!.userId,
        req.params.taskId as string,
        req.body.scheduledStartAt,
        req.body.scheduledEndAt,
        req.body.durationMinutes
      );
      sendSuccess(res, task);
    } catch (err: any) {
      sendError(res, err.code || 'RESCHEDULE_TASK_FAILED', err.message, err.status || 400);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await TaskService.updateStatus(req.user!.userId, req.params.taskId as string, req.body);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_STATUS_FAILED', err.message, err.status || 400);
    }
  }

  static async getTaskOutcomes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const outcomes = await TaskService.getTaskOutcomes(req.user!.userId, req.params.taskId as string);
      sendSuccess(res, outcomes);
    } catch (err: any) {
      sendError(res, err.code || 'GET_OUTCOMES_FAILED', err.message, err.status || 400);
    }
  }
}
