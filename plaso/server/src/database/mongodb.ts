import mongoose from 'mongoose';
import env from '../config/env';
import logger from '../utils/logger';

/**
 * Connect to MongoDB using the URI from environment configuration.
 * Logs success or failure. Does not crash the server if unavailable.
 */
export async function connectMongoDB(): Promise<void> {
  if (!env.mongodbUri) {
    logger.warn('MongoDB: MONGODB_URI is not configured. Skipping connection.');
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri);
    logger.success('MongoDB: Connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`MongoDB: Connection failed — ${message}`);
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB: Disconnected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`MongoDB: Disconnect error — ${message}`);
  }
}
