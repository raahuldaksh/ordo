import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { noSqlSanitize } from './middlewares/noSqlSanitize.js';
import { csrfProtection } from './middlewares/csrf.js';
import { generalApiLimiter } from './middlewares/rateLimiter.js';
import { apiRoutes } from './routes/index.js';
import { swaggerSpec } from './docs/swagger.js';
import { sendError } from './utils/response.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy (Render / Cloudflare) so req.ip and req.protocol are accurate (PRD §7)
  app.set('trust proxy', 1);

  // Normalize allowed origins
  const allowedOrigins = [
    config.frontendUrl,
    'https://ordo-dusky.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...config.allowedOrigins
  ].filter(Boolean).map(origin => origin.replace(/\/$/, ''));

  // 1. Strict Security Headers (PRD §7)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...allowedOrigins]
      }
    },
    hsts: config.env === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // 2. Strict CORS Configuration (PRD §7 & §12)
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // Allow Vercel preview and production deployments for ORDO
      if (normalizedOrigin.endsWith('.vercel.app') && normalizedOrigin.includes('ordo')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token']
  }));

  // 3. Lightweight Health Check Endpoints (for Render, Cloudflare, Uptime monitors - responds immediately 200 before auth/db)
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('ORDO Backend API is healthy and running');
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // 4. Response payload compression (Gzip / Deflate for fast mobile & high-latency performance)
  app.use(compression());

  // 5. Request parsing with body size limits to prevent DoS (PRD §7)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 6. NoSQL Operator Injection Defense (PRD §7 & §8)
  app.use(noSqlSanitize);

  // 7. CSRF Protection for cookie-authenticated state mutations (PRD §7)
  app.use(csrfProtection);

  // 8. Request correlation & logging
  app.use(requestLogger);

  // 9. Swagger Documentation (Public API exploration)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ORDO API Docs'
  }));

  // 10. General API Rate Limiting (PRD §7)
  app.use('/api/v1', generalApiLimiter);

  // 11. Mount API v1
  app.use('/api/v1', apiRoutes);

  // 12. 404 Handler
  app.use((req: Request, res: Response) => {
    sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
  });

  // 13. Centralized Error Handler (Prevents stack trace / database leaks)
  app.use(errorHandler);

  return app;
}
