import { Router } from 'express';
import { WeeklyReviewController } from '../controllers/weeklyReviewController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { createWeeklyReviewSchema, updateWeeklyReviewSchema } from '../validators/weeklyReview.js';

const router = Router();

router.use(requireAuth);

router.get('/', WeeklyReviewController.listReviews);
router.post('/', validateBody(createWeeklyReviewSchema), WeeklyReviewController.createReview);
router.get('/:reviewId', WeeklyReviewController.getReview);
router.patch('/:reviewId', validateBody(updateWeeklyReviewSchema), WeeklyReviewController.updateReview);

export const weeklyReviewRoutes = router;

