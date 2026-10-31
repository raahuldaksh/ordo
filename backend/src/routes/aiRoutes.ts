import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/generate', AiController.generate);
router.get('/', AiController.list);
router.post('/:insightId/feedback', AiController.feedback);
router.delete('/:insightId', AiController.delete);

export const aiRoutes = router;

