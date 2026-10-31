import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

  // 1. Strict Security Headers (PRD §7)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", config.frontendUrl, "http://localhost:3000"]
      }
    },
    hsts: config.env === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // 2. Strict CORS Configuration (PRD §7 & §12)
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token']
  }));

  // 3. Request parsing with body size limits to prevent DoS (PRD §7)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 4. NoSQL Operator Injection Defense (PRD §7 & §8)
  app.use(noSqlSanitize);

  // 5. CSRF Protection for cookie-authenticated state mutations (PRD §7)
  app.use(csrfProtection);

  // 6. Request correlation & logging
  app.use(requestLogger);

  // 7. Swagger Documentation (Public API exploration)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ORDO API Docs'
  }));

  // 8. General API Rate Limiting (PRD §7)
  app.use('/api/v1', generalApiLimiter);

  // 9. Mount API v1
  app.use('/api/v1', apiRoutes);

  // 10. 404 Handler
  app.use((req: Request, res: Response) => {
    sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
  });

  // 11. Centralized Error Handler (Prevents stack trace / database leaks)
  app.use(errorHandler);

  return app;
}
