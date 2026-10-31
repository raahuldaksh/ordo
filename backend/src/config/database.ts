import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

let mongodInstance: any = null;

export async function connectDatabase(): Promise<string> {
  let uri = config.mongodbUri;

  if (!uri) {
    logger.info('No MONGODB_URI provided. Initializing local in-memory MongoDB server...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'ordo'
        }
      });
      uri = mongodInstance.getUri();
      logger.info(`In-memory MongoDB initialized at: ${uri}`);
    } catch (err: any) {
      logger.error('Failed to start in-memory MongoDB server', { error: err.message });
      throw err;
    }
  }

  // If using mongodb+srv on Windows/local networks where router DNS blocks SRV queries,
  // configure reliable fallback DNS servers (Google / Cloudflare DNS)
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch {
      // ignore
    }
  }

  try {
    await mongoose.connect(uri);
    logger.info(`Connected to MongoDB Atlas: ${mongoose.connection.name} (host: ${mongoose.connection.host})`);
    return uri;
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    logger.info('Disconnected from MongoDB');
  } catch (err: any) {
    logger.error('Error disconnecting MongoDB', { error: err.message });
  }
}
