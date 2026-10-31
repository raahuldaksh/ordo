import { Router } from 'express';
import { PlannerController } from '../controllers/plannerController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/day', PlannerController.getDay);
router.get('/range', PlannerController.getRange);
router.get('/overlaps', PlannerController.getOverlaps);

export const plannerRoutes = router;

