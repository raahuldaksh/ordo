import { Router } from 'express';
import { RoutineController } from '../controllers/routineController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  createRoutineTemplateSchema,
  updateRoutineTemplateSchema,
  createRoutineItemSchema,
  updateRoutineItemSchema,
  applyRoutineSchema
} from '../validators/routine.js';

const router = Router();

router.use(requireAuth);

router.get('/', RoutineController.listRoutines);
router.post('/', validateBody(createRoutineTemplateSchema), RoutineController.createRoutine);
router.get('/:routineId', RoutineController.getRoutine);
router.patch('/:routineId', validateBody(updateRoutineTemplateSchema), RoutineController.updateRoutine);
router.delete('/:routineId', RoutineController.deleteRoutine);
router.post('/:routineId/duplicate', RoutineController.duplicateRoutine);
router.post('/:routineId/apply', validateBody(applyRoutineSchema), RoutineController.applyRoutine);

router.post('/:routineId/items', validateBody(createRoutineItemSchema), RoutineController.addItem);
router.patch('/:routineId/items/:itemId', validateBody(updateRoutineItemSchema), RoutineController.updateItem);
router.delete('/:routineId/items/:itemId', RoutineController.deleteItem);

export const routineRoutes = router;

