import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  rescheduleTaskSchema,
  updateTaskStatusSchema
} from '../validators/task.js';

const router = Router();

router.use(requireAuth);

router.get('/', TaskController.listTasks);
router.post('/', validateBody(createTaskSchema), TaskController.createTask);
router.get('/:taskId', TaskController.getTask);
router.patch('/:taskId', validateBody(updateTaskSchema), TaskController.updateTask);
router.delete('/:taskId', TaskController.deleteTask);
router.post('/:taskId/archive', TaskController.archiveTask);
router.post('/:taskId/duplicate', TaskController.duplicateTask);
router.post('/:taskId/reschedule', validateBody(rescheduleTaskSchema), TaskController.rescheduleTask);
router.post('/:taskId/status', validateBody(updateTaskStatusSchema), TaskController.updateStatus);
router.get('/:taskId/outcomes', TaskController.getTaskOutcomes);

export const taskRoutes = router;

