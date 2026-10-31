import dotenv from 'dotenv';
const isJest = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';
dotenv.config();

export const config = {
  env: isJest ? 'test' : (process.env.NODE_ENV || 'development'),
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)
    : [],
  cookieSameSite: ((process.env.COOKIE_SAME_SITE as any) || (isJest ? 'lax' : (process.env.NODE_ENV === 'production' ? 'none' : 'lax'))) as 'lax' | 'none' | 'strict',
  mongodbUri: process.env.MONGODB_URI || '',
  sessionSecret: process.env.SESSION_SECRET || 'ordo-super-secret-session-key-dev-32chars',
  jwtAccessSecret: process.env.ACCESS_TOKEN_SECRET || 'ordo-jwt-access-secret-32-chars-long-here-991',
  jwtRefreshSecret: process.env.REFRESH_TOKEN_SECRET || 'ordo-jwt-refresh-secret-32-chars-long-here-992',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
  googleCalendarRedirectUrl: process.env.GOOGLE_CALENDAR_REDIRECT_URL || 'http://localhost:5000/api/v1/calendar/google/callback',
  emailApiKey: process.env.EMAIL_PROVIDER_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@ordo.app',
  redisUrl: process.env.REDIS_URL || '',
  aiApiKey: process.env.AI_PROVIDER_API_KEY || '',
  encryptionKey: process.env.OAUTH_TOKEN_ENCRYPTION_KEY || '12345678901234567890123456789012'
};

