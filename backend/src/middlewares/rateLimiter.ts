import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'test' ? 100 : 15, // Max 15 attempts per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'TOO_MANY_REQUESTS', 'Too many login or registration attempts. Please try again in 15 minutes.', 429);
  }
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'test' ? 50 : 5, // Max 5 requests per hour in production
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'TOO_MANY_REQUESTS', 'Too many password reset requests. Please try again later.', 429);
  }
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 mins for authenticated usage
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'TOO_MANY_REQUESTS', 'Rate limit exceeded. Please throttle requests.', 429);
  }
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 AI analyses per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'TOO_MANY_REQUESTS', 'Hourly AI analysis quota reached. Please try again next hour.', 429);
  }
});
