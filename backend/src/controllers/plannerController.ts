import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PlannerController {
  static async getDay(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const schedule = await PlannerService.getDaySchedule(req.user!.userId, date);
      sendSuccess(res, schedule);
    } catch (err: any) {
      sendError(res, err.code || 'GET_DAY_SCHEDULE_FAILED', err.message, err.status || 400);
    }
  }

  static async getRange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        sendError(res, 'MISSING_PARAMS', 'Both from and to query params are required', 400);
        return;
      }
      const tasks = await PlannerService.getRangeSchedule(req.user!.userId, from, to);
      sendSuccess(res, tasks);
    } catch (err: any) {
      sendError(res, err.code || 'GET_RANGE_SCHEDULE_FAILED', err.message, err.status || 400);
    }
  }

  static async getOverlaps(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startAt = req.query.startAt as string;
      const endAt = req.query.endAt as string;
      const excludeTaskId = req.query.excludeTaskId as string;

      if (!startAt || !endAt) {
        sendError(res, 'MISSING_PARAMS', 'Both startAt and endAt query params are required', 400);
        return;
      }

      const result = await PlannerService.checkOverlaps(req.user!.userId, startAt, endAt, excludeTaskId);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'CHECK_OVERLAPS_FAILED', err.message, err.status || 400);
    }
  }
}

