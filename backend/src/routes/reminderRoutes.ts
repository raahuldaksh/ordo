import { Router } from 'express';
import { ReminderController } from '../controllers/reminderController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ReminderController.listReminders);
router.post('/', ReminderController.createReminder);
router.patch('/:reminderId', ReminderController.updateReminder);
router.delete('/:reminderId', ReminderController.deleteReminder);

export const reminderRoutes = router;

