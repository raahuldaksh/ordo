import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { updatePreferencesSchema } from '../validators/preferences.js';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);
router.get('/me/preferences', UserController.getPreferences);
router.patch('/me/preferences', validateBody(updatePreferencesSchema), UserController.updatePreferences);
router.post('/me/export', UserController.exportUserData);
router.delete('/me', UserController.deleteAccount);

export const userRoutes = router;

