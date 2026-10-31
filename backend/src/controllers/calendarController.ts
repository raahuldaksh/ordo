import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { CalendarService } from '../services/calendarService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CalendarController {
  static async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      const events = await CalendarService.getEvents(req.user!.userId, from, to);
      sendSuccess(res, events);
    } catch (err: any) {
      sendError(res, err.code || 'GET_EVENTS_FAILED', err.message, err.status || 400);
    }
  }

  static async getConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const connections = await CalendarService.getConnections(req.user!.userId);
      sendSuccess(res, connections);
    } catch (err: any) {
      sendError(res, err.code || 'GET_CONNECTIONS_FAILED', err.message, err.status || 400);
    }
  }

  static async connectGoogle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const connection = await CalendarService.connectGoogleCalendar(req.user!.userId, code || 'dev_auth_code');
      sendSuccess(res, connection);
    } catch (err: any) {
      sendError(res, err.code || 'CONNECT_GOOGLE_FAILED', err.message, err.status || 400);
    }
  }

  static async syncConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CalendarService.syncConnection(req.user!.userId, req.params.connectionId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'SYNC_CONNECTION_FAILED', err.message, err.status || 400);
    }
  }

  static async updateConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const connection = await CalendarService.updateConnection(req.user!.userId, req.params.connectionId as string, req.body);
      sendSuccess(res, connection);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_CONNECTION_FAILED', err.message, err.status || 400);
    }
  }

  static async disconnectConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CalendarService.disconnectConnection(req.user!.userId, req.params.connectionId as string);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.code || 'DISCONNECT_CONNECTION_FAILED', err.message, err.status || 400);
    }
  }
}
