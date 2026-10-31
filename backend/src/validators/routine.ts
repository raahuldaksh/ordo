import { z } from 'zod';
import { RoutineTemplateType, TaskPriority, TaskType, ConflictStrategy } from '../constants/enums.js';

export const createRoutineTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  templateType: z.nativeEnum(RoutineTemplateType).default(RoutineTemplateType.DAILY),
  description: z.string().max(1000).default(''),
  timezone: z.string().default('UTC')
});

export const updateRoutineTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  templateType: z.nativeEnum(RoutineTemplateType).optional(),
  description: z.string().max(1000).optional(),
  timezone: z.string().optional()
});

export const createRoutineItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).default(''),
  taskType: z.nativeEnum(TaskType).default(TaskType.FIXED),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  startTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'startTimeLocal must be HH:mm (e.g. 09:00)'),
  endTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'endTimeLocal must be HH:mm (e.g. 10:00)'),
  durationMinutes: z.number().int().min(5).max(1440).default(30),
  recurrenceRule: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0)
});

export const updateRoutineItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  taskType: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  startTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  durationMinutes: z.number().int().min(5).max(1440).optional(),
  recurrenceRule: z.string().nullable().optional(),
  sortOrder: z.number().int().optional()
});

export const applyRoutineSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  conflictStrategy: z.nativeEnum(ConflictStrategy).default(ConflictStrategy.SKIP),
  idempotencyKey: z.string().optional()
});

