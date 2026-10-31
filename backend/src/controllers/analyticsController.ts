import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AnalyticsController {
  static async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      const groupBy = (req.query.groupBy as string) || 'day';

      const summary = await AnalyticsService.getSummary(req.user!.userId, from, to, groupBy);
      sendSuccess(res, summary);
    } catch (err: any) {
      sendError(res, err.code || 'GET_ANALYTICS_FAILED', err.message, err.status || 400);
    }
  }

  static async getReasons(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;

      const reasons = await AnalyticsService.getReasons(req.user!.userId, from, to);
      sendSuccess(res, reasons);
    } catch (err: any) {
      sendError(res, err.code || 'GET_REASONS_FAILED', err.message, err.status || 400);
    }
  }
}

