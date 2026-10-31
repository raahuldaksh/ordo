import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { RoutineService } from '../services/routineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RoutineController {
  static async listRoutines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routines = await RoutineService.listTemplates(req.user!.userId);
      sendSuccess(res, routines);
    } catch (err: any) {
      sendError(res, err.code || 'LIST_ROUTINES_FAILED', err.message, err.status || 400);
    }
  }

  static async createRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routine = await RoutineService.createTemplate(req.user!.userId, req.body);
      sendSuccess(res, routine, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'CREATE_ROUTINE_FAILED', err.message, err.status || 400);
    }
  }

  static async getRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routine = await RoutineService.getTemplate(req.user!.userId, req.params.routineId as string);
      sendSuccess(res, routine);
    } catch (err: any) {
      sendError(res, err.code || 'GET_ROUTINE_FAILED', err.message, err.status || 404);
    }
  }

  static async updateRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const routine = await RoutineService.updateTemplate(req.user!.userId, req.params.routineId as string, req.body);
      sendSuccess(res, routine);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ROUTINE_FAILED', err.message, err.status || 400);
    }
  }

  static async deleteRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await RoutineService.deleteTemplate(req.user!.userId, req.params.routineId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_ROUTINE_FAILED', err.message, err.status || 400);
    }
  }

  static async duplicateRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const duplicate = await RoutineService.duplicateTemplate(req.user!.userId, req.params.routineId as string);
      sendSuccess(res, duplicate, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'DUPLICATE_ROUTINE_FAILED', err.message, err.status || 400);
    }
  }

  static async applyRoutine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, conflictStrategy } = req.body;
      const result = await RoutineService.applyRoutine(
        req.user!.userId,
        req.params.routineId as string,
        startDate,
        endDate,
        conflictStrategy
      );
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'APPLY_ROUTINE_FAILED', err.message, err.status || 400);
    }
  }

  static async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const item = await RoutineService.addTemplateItem(req.user!.userId, req.params.routineId as string, req.body);
      sendSuccess(res, item, {}, 201);
    } catch (err: any) {
      sendError(res, err.code || 'ADD_ROUTINE_ITEM_FAILED', err.message, err.status || 400);
    }
  }

  static async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const item = await RoutineService.updateTemplateItem(
        req.user!.userId,
        req.params.routineId as string,
        req.params.itemId as string,
        req.body
      );
      sendSuccess(res, item);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ROUTINE_ITEM_FAILED', err.message, err.status || 400);
    }
  }

  static async deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await RoutineService.deleteTemplateItem(
        req.user!.userId,
        req.params.routineId as string,
        req.params.itemId as string
      );
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_ROUTINE_ITEM_FAILED', err.message, err.status || 400);
    }
  }
}
