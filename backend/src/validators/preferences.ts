import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  locale: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
  defaultTaskDurationMinutes: z.number().int().min(5).max(480).optional(),
  wakeTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  sleepTimeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  }).optional(),
  notificationPreferences: z.object({
    taskStart: z.boolean().optional(),
    taskDeadline: z.boolean().optional(),
    dailyPlanning: z.boolean().optional(),
    dailyReview: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional()
  }).optional()
});

