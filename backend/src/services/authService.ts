import { User, UserPreferences } from '../models/index.js';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export class AuthService {
  static async register(data: { fullName: string; email: string; password: string }) {
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' };
    }

    const passwordHash = await hashPassword(data.password);
    const verificationToken = generateRandomToken();

    const user = await User.create({
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerifiedAt: new Date(), // Auto-verify in development for seamless onboarding
      accountStatus: 'ACTIVE'
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

    const tokenPayload = { userId: user._id.toString(), email: user.email };
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

  static async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (!user || !user.passwordHash) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw { status: 403, code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended.' };
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const tokenPayload = { userId: user._id.toString(), email: user.email };
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
    const user = await User.findById(userId).select('-passwordHash -resetPasswordToken -emailVerificationToken');
    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }
    const preferences = await UserPreferences.findOne({ userId });
    return { user, preferences };
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success message to avoid account enumeration
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
      devResetToken: resetToken // Helpful for local testing
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      throw { status: 400, code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset token is invalid or has expired.' };
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'Password reset successfully. You can now log in.' };
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
    await user.save();

    return { message: 'Password changed successfully.' };
  }

  static async handleGoogleAuth(googleUser: { googleId: string; email: string; fullName: string }) {
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        fullName: googleUser.fullName,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.googleId,
        emailVerifiedAt: new Date(),
        accountStatus: 'ACTIVE'
      });

      await UserPreferences.create({
        userId: user._id,
        timezone: 'UTC',
        theme: 'system',
        timeFormat: '24h',
        weekStartsOn: 1
      });
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
      }
      await user.save();
    }

    const tokenPayload = { userId: user._id.toString(), email: user.email };
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
}

