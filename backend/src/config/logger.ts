import winston from 'winston';
import { config } from './env.js';

const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'accessToken', 'secret', 'actualReason'];

const maskSensitiveData = winston.format((info) => {
  const mask = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(mask);
    const masked: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        masked[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        masked[key] = mask(obj[key]);
      } else {
        masked[key] = obj[key];
      }
    }
    return masked;
  };
  return mask(info);
});

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    maskSensitiveData(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test'
    })
  ]
});
