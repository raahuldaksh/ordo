import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ReminderService } from './services/reminderService.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  try {
    // 1. Initialize Express application first so HTTP port binds immediately for Render
    const app = createApp();
    const PORT = Number(process.env.PORT) || config.port || 10000;
    const HOST = '0.0.0.0';

    // 2. Bind server to 0.0.0.0 and PORT (Render requirement)
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server listening on port ${PORT} (${HOST})`);
      logger.info(`ORDO Backend API listening on ${HOST}:${PORT} (${config.env} mode)`);
      logger.info(`Health check available at: http://${HOST}:${PORT}/health`);
      logger.info(`Root endpoint available at: http://${HOST}:${PORT}/`);
      logger.info(`OpenAPI Swagger documentation available at: http://${HOST}:${PORT}/api/docs`);
    });

    // 3. Non-blocking Database Connection: allows HTTP server to immediately answer Render health checks
    connectDatabase()
      .then(() => {
        logger.info('MongoDB connected successfully');
        ReminderService.startScheduler();
      })
      .catch((err: any) => {
        console.error('MongoDB connection error during startup:', err);
        logger.error('MongoDB connection error during startup:', { error: err.message });
      });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      ReminderService.stopScheduler();
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err: any) {
    console.error('Failed to initialize server:', err);
    logger.error('Failed to initialize server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();


