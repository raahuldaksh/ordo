import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession {
  sessionId: string;
  userAgent?: string;
  ip?: string;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash?: string | null;
  emailVerifiedAt?: Date | null;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;
  tokenVersion: number;
  activeSessions: IUserSession[];
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  passwordChangedAt?: Date | null;
  googleId?: string | null;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  pendingEmail?: string | null;
  pendingEmailTokenHash?: string | null;
  pendingEmailExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<IUserSession>(
  {
    sessionId: { type: String, required: true },
    userAgent: { type: String, default: 'Unknown' },
    ip: { type: String, default: 'Unknown' },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationTokenHash: { type: String, default: null, index: true },
    emailVerificationExpires: { type: Date, default: null },
    resetPasswordTokenHash: { type: String, default: null, index: true },
    resetPasswordExpires: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    activeSessions: { type: [sessionSchema], default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    googleId: { type: String, default: null },
    accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    pendingEmail: { type: String, default: null },
    pendingEmailTokenHash: { type: String, default: null },
    pendingEmailExpires: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
