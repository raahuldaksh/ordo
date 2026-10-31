import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { AiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AiController {
  static async generate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodStart, periodEnd, userConsent } = req.body;
      const start = periodStart || new Date(Date.now() - 7 * 86400000).toISOString();
      const end = periodEnd || new Date().toISOString();

      const insight = await AiService.generateInsights(req.user!.userId, start, end, userConsent ?? true);
      sendSuccess(res, insight, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'GENERATE_AI_FAILED', err.message, err.status || 400);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const insights = await AiService.listInsights(req.user!.userId);
      sendSuccess(res, insights);
    } catch (err: any) {
      sendError(res, err.code || 'LIST_AI_FAILED', err.message, err.status || 400);
    }
  }

  static async feedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const insight = await AiService.recordFeedback(req.user!.userId, req.params.insightId as string, req.body.feedback);
      sendSuccess(res, insight);
    } catch (err: any) {
      sendError(res, err.code || 'FEEDBACK_FAILED', err.message, err.status || 400);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AiService.deleteInsight(req.user!.userId, req.params.insightId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_AI_FAILED', err.message, err.status || 400);
    }
  }
}
