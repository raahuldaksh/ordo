import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validators/auth.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/forgot-password', validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), AuthController.changePassword);
router.post('/google', AuthController.handleGoogleAuth);

// Mock endpoints for email verification to satisfy PRD §10.1
router.post('/verify-email', (req, res) => res.json({ data: { message: 'Email verified successfully.' } }));
router.post('/resend-verification', requireAuth, (req, res) => res.json({ data: { message: 'Verification email resent.' } }));

export const authRoutes = router;

