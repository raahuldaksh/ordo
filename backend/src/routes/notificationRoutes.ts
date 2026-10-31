import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.listNotifications);
router.post('/read-all', NotificationController.markAllAsRead);
router.post('/:notificationId/read', NotificationController.markAsRead);

export const notificationRoutes = router;

