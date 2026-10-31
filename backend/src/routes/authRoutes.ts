import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema
} from '../validators/auth.js';

const router = Router();

// CSRF token retrieval
router.get('/csrf', AuthController.getCsrfToken);

// Rate-limited auth entry points
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), AuthController.changePassword);
router.post('/verify-email', validateBody(verifyEmailSchema), AuthController.verifyEmail);
router.post('/google', authLimiter, AuthController.handleGoogleAuth);

// Session management
router.get('/sessions', requireAuth, AuthController.listSessions);
router.post('/sessions/revoke-all', requireAuth, AuthController.revokeAllSessions);

export const authRoutes = router;
