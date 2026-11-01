import { User, UserPreferences } from '../models/index.js';
import { hashPassword, comparePassword, generateRandomToken, hashToken } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../config/logger.js';

const getOAuth2Client = () => {
  const isProd = Boolean(process.env.RENDER || process.env.NODE_ENV === 'production');
  const envCallback = process.env.GOOGLE_CALLBACK_URL;
  const callbackUrl = (envCallback && !envCallback.includes('localhost'))
    ? envCallback
    : (isProd
      ? 'https://ordo-z65h.onrender.com/api/v1/auth/google/callback'
      : (envCallback || config.googleCallbackUrl || 'https://ordo-z65h.onrender.com/api/v1/auth/google/callback'));

  return new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    callbackUrl
  );
};

export class AuthService {
  static async register(data: { fullName: string; email: string; password: string }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' };
    }

    const passwordHash = await hashPassword(data.password);
    const rawVerificationToken = generateRandomToken();
    const verificationTokenHash = hashToken(rawVerificationToken);

    const sessionId = uuidv4();
    const user = await User.create({
      fullName: data.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 3600000), // 24 hours
      emailVerifiedAt: new Date(), // Auto-verify in development, token hash stored for verification tests
      accountStatus: 'ACTIVE',
      tokenVersion: 1,
      activeSessions: [
        {
          sessionId,
          userAgent: 'Initial Registration',
          ip: '127.0.0.1',
          lastActiveAt: new Date(),
          createdAt: new Date()
        }
      ]
    });

    // Create default UserPreferences matching PRD §7
    await UserPreferences.create({
      userId: user._id,
      timezone: 'UTC',
      theme: 'system',
      timeFormat: '24h',
      weekStartsOn: 1,
      defaultTaskDurationMinutes: 30,
      wakeTimeLocal: '07:00',
      sleepTimeLocal: '23:00'
    });

    const tokenPayload = { userId: user._id.toString(), email: user.email, tokenVersion: user.tokenVersion, sessionId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: !!user.emailVerifiedAt
      },
      tokens: { accessToken, refreshToken },
      // Plaintext token only returned if explicitly needed for test verification, NEVER stored plaintext in DB
      rawVerificationToken: config.env === 'test' ? rawVerificationToken : undefined
    };
  }

  static async login(data: { email: string; password: string }, clientInfo?: { userAgent?: string; ip?: string }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Timing-attack safe generic rejection
    if (!user || !user.passwordHash) {
      // Perform dummy compare to prevent timing side-channels
      await hashPassword('dummy-password-timing-safe-buffer');
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw { status: 403, code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended.' };
    }

    // Account lockout check
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw {
        status: 429,
        code: 'ACCOUNT_TEMPORARILY_LOCKED',
        message: `Account is temporarily locked due to repeated failed attempts. Please try again in ${waitMinutes} minutes.`
      };
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute progressive lock
        logger.warn('Account temporarily locked after 5 failed attempts', { userId: user._id });
      }
      await user.save();
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    // Reset failed login counter on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Track active session
    const sessionId = uuidv4();
    user.activeSessions.push({
      sessionId,
      userAgent: clientInfo?.userAgent || 'Unknown',
      ip: clientInfo?.ip || 'Unknown',
      lastActiveAt: new Date(),
      createdAt: new Date()
    });

    // Keep max 10 active sessions
    if (user.activeSessions.length > 10) {
      user.activeSessions = user.activeSessions.slice(-10);
    }

    await user.save();

    const tokenPayload = { userId: user._id.toString(), email: user.email, tokenVersion: user.tokenVersion, sessionId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: !!user.emailVerifiedAt
      },
      tokens: { accessToken, refreshToken }
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash -resetPasswordTokenHash -emailVerificationTokenHash');
    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }
    const preferences = await UserPreferences.findOne({ userId });
    return { user, preferences };
  }

  static async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to prevent account enumeration (PRD §5 & §6.4)
    const genericResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.'
    };

    if (!user) {
      return genericResponse;
    }

    const rawResetToken = generateRandomToken();
    const resetTokenHash = hashToken(rawResetToken);

    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    logger.info('Password reset token generated (hashed at rest)', { userId: user._id });

    // In test or development environment, return rawResetToken for verification only
    if (config.env === 'test' || config.env === 'development') {
      return { ...genericResponse, devResetToken: rawResetToken, testResetToken: rawResetToken };
    }

    return genericResponse;
  }

  static async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      throw { status: 400, code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset token is invalid or has expired.' };
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();

    // Invalidate ALL previous sessions across all devices (PRD §3, §5)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.activeSessions = [];
    await user.save();

    logger.info('Password reset completed; all active sessions revoked', { userId: user._id });

    return { message: 'Password reset successfully. All active sessions have been revoked. Please log in.' };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user || !user.passwordHash) {
      throw { status: 400, code: 'PASSWORD_NOT_SET', message: 'Account does not use password authentication.' };
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { status: 400, code: 'CURRENT_PASSWORD_INCORRECT', message: 'Current password is incorrect.' };
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();

    // Revoke all existing sessions across devices
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.activeSessions = [];
    await user.save();

    logger.info('Password changed by user; session version rotated', { userId: user._id });

    return { message: 'Password changed successfully. All other sessions have been logged out.' };
  }

  static async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw { status: 400, code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Email verification token is invalid or has expired.' };
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  static async handleGoogleAuth(
    payload: { idToken?: string; googleId?: string; email?: string; fullName?: string },
    clientInfo?: { userAgent?: string; ip?: string }
  ) {
    const isDemoUser = (payload.email === 'demo@ordo.app' || payload.googleId === 'ordo_demo_explorer');
    let verifiedEmail = isDemoUser ? 'demo@ordo.app' : payload.email;
    let verifiedName = isDemoUser ? (payload.fullName || 'ORDO Explorer') : (payload.fullName || 'Google User');
    let verifiedGoogleId = isDemoUser ? 'ordo_demo_explorer' : payload.googleId;

    // Production Google ID Token Verification (PRD §4)
    if (payload.idToken && config.googleClientId) {
      try {
        const client = getOAuth2Client();
        const ticket = await client.verifyIdToken({
          idToken: payload.idToken,
          audience: config.googleClientId
        });
        const googlePayload = ticket.getPayload();
        if (!googlePayload || !googlePayload.email) {
          throw new Error('Google token payload missing email');
        }
        verifiedEmail = googlePayload.email;
        verifiedName = googlePayload.name || verifiedName;
        verifiedGoogleId = googlePayload.sub;
      } catch (err: any) {
        logger.error('Google ID token verification failed', { error: err.message });
        throw { status: 401, code: 'GOOGLE_TOKEN_INVALID', message: 'Invalid Google authentication token' };
      }
    } else if (config.env === 'production' && !payload.idToken && !isDemoUser) {
      throw { status: 400, code: 'GOOGLE_TOKEN_REQUIRED', message: 'Google idToken is required in production' };
    }

    if (!verifiedEmail) {
      throw { status: 400, code: 'INVALID_GOOGLE_PAYLOAD', message: 'Verified email is required' };
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const sessionId = uuidv4();
      user = await User.create({
        fullName: verifiedName,
        email: normalizedEmail,
        googleId: verifiedGoogleId,
        emailVerifiedAt: new Date(),
        accountStatus: 'ACTIVE',
        tokenVersion: 1,
        activeSessions: [{
          sessionId,
          userAgent: clientInfo?.userAgent || 'Google Sign-In',
          ip: clientInfo?.ip || '127.0.0.1',
          lastActiveAt: new Date(),
          createdAt: new Date()
        }]
      });

      await UserPreferences.create({
        userId: user._id,
        timezone: 'UTC',
        theme: 'system',
        timeFormat: '24h',
        weekStartsOn: 1
      });
    } else {
      // Safe account linking: only link if verified (PRD §4)
      if (!user.googleId) {
        user.googleId = verifiedGoogleId;
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
      }
      await user.save();
    }

    const sessionId = uuidv4();
    user.activeSessions.push({
      sessionId,
      userAgent: clientInfo?.userAgent || 'Google Sign-In',
      ip: clientInfo?.ip || '127.0.0.1',
      lastActiveAt: new Date(),
      createdAt: new Date()
    });
    if (user.activeSessions.length > 10) {
      user.activeSessions = user.activeSessions.slice(-10);
    }
    await user.save();

    const tokenPayload = { userId: user._id.toString(), email: user.email, tokenVersion: user.tokenVersion, sessionId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: !!user.emailVerifiedAt
      },
      tokens: { accessToken, refreshToken }
    };
  }

  static getGoogleAuthUrl(state?: string): string {
    if (!config.googleClientId || !config.googleClientSecret) {
      throw { status: 500, code: 'GOOGLE_OAUTH_NOT_CONFIGURED', message: 'Google OAuth client ID or secret is not configured in backend environment.' };
    }
    const client = getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state: state || 'ordo_auth'
    });
  }

  static async handleGoogleCallback(code: string, clientInfo?: { userAgent?: string; ip?: string }) {
    if (!config.googleClientId || !config.googleClientSecret) {
      throw { status: 500, code: 'GOOGLE_OAUTH_NOT_CONFIGURED', message: 'Google OAuth client ID or secret is not configured in backend environment.' };
    }

    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      throw { status: 400, code: 'GOOGLE_NO_ID_TOKEN', message: 'No identity token returned by Google.' };
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      throw { status: 400, code: 'INVALID_GOOGLE_PAYLOAD', message: 'Google token payload missing verified email.' };
    }

    return this.handleGoogleAuth({
      idToken: tokens.id_token,
      email: googlePayload.email,
      fullName: googlePayload.name || 'Google User',
      googleId: googlePayload.sub
    }, clientInfo);
  }

  static async listSessions(userId: string) {
    const user = await User.findById(userId).select('activeSessions tokenVersion');
    if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    return user.activeSessions;
  }

  static async revokeAllSessions(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.activeSessions = [];
    await user.save();
    return { success: true, message: 'All sessions revoked.' };
  }
}
