import { Router } from 'express';
import { CalendarController } from '../controllers/calendarController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/events', CalendarController.getEvents);
router.get('/connections', CalendarController.getConnections);
router.post('/google/connect', CalendarController.connectGoogle);
router.post('/connections/:connectionId/sync', CalendarController.syncConnection);
router.patch('/connections/:connectionId', CalendarController.updateConnection);
router.delete('/connections/:connectionId', CalendarController.disconnectConnection);

export const calendarRoutes = router;

