import app from './app';
import env from './config/env';
import logger from './utils/logger';
import { connectMongoDB, disconnectMongoDB } from './database/mongodb';
import { connectNeo4j, disconnectNeo4j } from './database/neo4j';

/**
 * Start the Plaso API server.
 * Connects to databases and begins listening for requests.
 */
async function startServer(): Promise<void> {
  logger.info('Starting Plaso API...');

  // Connect databases (non-blocking — server starts regardless)
  await connectMongoDB();
  await connectNeo4j();

  // Start HTTP server
  app.listen(env.port, '0.0.0.0', () => {
    logger.success(`API: Running on port ${env.port} (0.0.0.0)`);
    logger.info(`Environment: ${env.nodeEnv}`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);
  });
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down Plaso API...');
  await disconnectMongoDB();
  await disconnectNeo4j();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
