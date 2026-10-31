import { Router } from 'express';
import mongoose from 'mongoose';
import { authRoutes } from './authRoutes.js';
import { userRoutes } from './userRoutes.js';
import { taskRoutes } from './taskRoutes.js';
import { plannerRoutes } from './plannerRoutes.js';
import { routineRoutes } from './routineRoutes.js';
import { calendarRoutes } from './calendarRoutes.js';
import { reminderRoutes } from './reminderRoutes.js';
import { notificationRoutes } from './notificationRoutes.js';
import { analyticsRoutes } from './analyticsRoutes.js';
import { weeklyReviewRoutes } from './weeklyReviewRoutes.js';
import { aiRoutes } from './aiRoutes.js';

const router = Router();

// Health check endpoint (PRD §16 - reports API status and DB connectivity without exposing credentials)
router.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'ordo'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount /api/v1 domain routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/planner', plannerRoutes);
router.use('/routines', routineRoutes);
router.use('/calendar', calendarRoutes);
router.use('/reminders', reminderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/weekly-reviews', weeklyReviewRoutes);
router.use('/ai-insights', aiRoutes);

export const apiRoutes = router;

