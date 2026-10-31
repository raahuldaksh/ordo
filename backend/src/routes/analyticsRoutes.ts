import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', AnalyticsController.getSummary);
router.get('/reasons', AnalyticsController.getReasons);

export const analyticsRoutes = router;

