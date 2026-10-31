import { z } from 'zod';

export const createWeeklyReviewSchema = z.object({
  weekStartDate: z.string().datetime({ offset: true }),
  weekEndDate: z.string().datetime({ offset: true }),
  wins: z.string().max(2000).default(''),
  challenges: z.string().max(2000).default(''),
  recurringReasons: z.array(z.string()).default([]),
  nextWeekChanges: z.string().max(2000).default('')
});

export const updateWeeklyReviewSchema = z.object({
  wins: z.string().max(2000).optional(),
  challenges: z.string().max(2000).optional(),
  recurringReasons: z.array(z.string()).optional(),
  nextWeekChanges: z.string().max(2000).optional()
});

