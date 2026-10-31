import { z } from 'zod';
import { TaskPriority, TaskStatus, TaskType, ReasonCategory } from '../constants/enums.js';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  taskType: z.nativeEnum(TaskType).default(TaskType.FLEXIBLE),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  scheduledStartAt: z.string().datetime({ offset: true }).nullable().optional(),
  scheduledEndAt: z.string().datetime({ offset: true }).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(1440).default(30),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  timezone: z.string().default('UTC'),
  recurrenceRule: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(30)).default([])
}).refine(data => {
  if (data.scheduledStartAt && data.scheduledEndAt) {
    return new Date(data.scheduledEndAt) > new Date(data.scheduledStartAt);
  }
  return true;
}, {
  message: 'scheduledEndAt must be later than scheduledStartAt',
  path: ['scheduledEndAt']
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  taskType: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  scheduledStartAt: z.string().datetime({ offset: true }).nullable().optional(),
  scheduledEndAt: z.string().datetime({ offset: true }).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(1440).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  timezone: z.string().optional(),
  recurrenceRule: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(30)).optional()
}).refine(data => {
  if (data.scheduledStartAt && data.scheduledEndAt) {
    return new Date(data.scheduledEndAt) > new Date(data.scheduledStartAt);
  }
  return true;
}, {
  message: 'scheduledEndAt must be later than scheduledStartAt',
  path: ['scheduledEndAt']
});

export const rescheduleTaskSchema = z.object({
  scheduledStartAt: z.string().datetime({ offset: true }),
  scheduledEndAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(5).max(1440).optional()
}).refine(data => new Date(data.scheduledEndAt) > new Date(data.scheduledStartAt), {
  message: 'scheduledEndAt must be later than scheduledStartAt',
  path: ['scheduledEndAt']
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  reasonCategory: z.nativeEnum(ReasonCategory).nullable().optional(),
  actualReason: z.string().max(1000).nullable().optional(),
  actualStartedAt: z.string().datetime({ offset: true }).nullable().optional(),
  actualEndedAt: z.string().datetime({ offset: true }).nullable().optional(),
  actualDurationMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  note: z.string().max(500).nullable().optional()
});

