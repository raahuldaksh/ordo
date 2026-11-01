import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

let mongodInstance: any = null;

async function startInMemoryServer(): Promise<string> {
  try {
    // Dynamic runtime import to completely isolate in-memory server from production TypeScript compilation
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const { MongoMemoryServer } = await dynamicImport('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'ordo'
      }
    });
    return mongodInstance.getUri();
  } catch (err: any) {
    logger.error('Failed to start in-memory MongoDB server', { error: err.message });
    throw err;
  }
}

export async function connectDatabase(): Promise<string> {
  let uri = config.mongodbUri;

  if (!uri) {
    if (config.env === 'production') {
      const err = new Error('CRITICAL: MONGODB_URI is required in production environment. In-memory database is strictly disabled in production.');
      logger.error(err.message);
      throw err;
    }
    logger.info('No MONGODB_URI provided. Initializing local in-memory MongoDB server...');
    uri = await startInMemoryServer();
    logger.info(`In-memory MongoDB initialized at: ${uri}`);
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
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`Connected to MongoDB Atlas: ${mongoose.connection.name} (host: ${mongoose.connection.host})`);
    return uri;
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB Atlas', { error: err.message });
    if (config.env === 'production') {
      throw err;
    }
    logger.warn('Atlas cluster unreachable (likely IP whitelist). Initializing in-memory MongoDB fallback for local development...');
    try {
      const fallbackUri = await startInMemoryServer();
      await mongoose.connect(fallbackUri);
      logger.info(`Connected to in-memory MongoDB fallback at: ${fallbackUri}`);
      return fallbackUri;
    } catch (fallbackErr: any) {
      logger.error('Failed to initialize fallback in-memory MongoDB', { error: fallbackErr.message });
      throw err;
    }
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
