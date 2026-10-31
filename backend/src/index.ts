import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ReminderService } from './services/reminderService.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB (Atlas or in-memory fallback)
    await connectDatabase();

    // 2. Start Reminder Scheduler
    ReminderService.startScheduler();

    // 3. Initialize Express application
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`ORDO Backend API listening on port ${config.port} (${config.env} mode)`);
      logger.info(`Health check available at: http://localhost:${config.port}/api/v1/health`);
      logger.info(`OpenAPI Swagger documentation available at: http://localhost:${config.port}/api/docs`);
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
    logger.error('Failed to initialize server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();

