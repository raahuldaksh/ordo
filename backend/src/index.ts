import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ReminderService } from './services/reminderService.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  try {
    // 0. Production sanity checks
    if (config.env === 'production' && !config.mongodbUri) {
      logger.error('CRITICAL: MONGODB_URI must be set in production. Aborting process.');
      process.exit(1);
    }

    // 1. Connect to MongoDB (Atlas or in-memory fallback)
    await connectDatabase();

    // 2. Start Reminder Scheduler
    ReminderService.startScheduler();

    // 3. Initialize Express application
    const app = createApp();
    const host = '0.0.0.0';

    const server = app.listen(config.port, host, () => {
      logger.info(`ORDO Backend API listening on ${host}:${config.port} (${config.env} mode)`);
      logger.info(`Health check available at: http://${host}:${config.port}/api/v1/health`);
      logger.info(`OpenAPI Swagger documentation available at: http://${host}:${config.port}/api/docs`);
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

