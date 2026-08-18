import neo4j, { Driver } from 'neo4j-driver';
import env from '../config/env';
import logger from '../utils/logger';

let driver: Driver | null = null;

/**
 * Connect to Neo4j using credentials from environment configuration.
 * Creates a reusable driver instance and verifies connectivity.
 */
export async function connectNeo4j(): Promise<void> {
  if (!env.neo4jUri || !env.neo4jPassword) {
    logger.warn('Neo4j: URI or password not configured. Skipping connection.');
    return;
  }

  try {
    driver = neo4j.driver(
      env.neo4jUri,
      neo4j.auth.basic(env.neo4jUsername, env.neo4jPassword)
    );

    // Verify connectivity
    await driver.verifyConnectivity();
    logger.success('Neo4j: Connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Neo4j: Connection failed — ${message}`);
    driver = null;
  }
}

/**
 * Get the Neo4j driver instance.
 * Returns null if not connected.
 */
export function getNeo4jDriver(): Driver | null {
  return driver;
}

/**
 * Gracefully close the Neo4j driver.
 */
export async function disconnectNeo4j(): Promise<void> {
  if (driver) {
    try {
      await driver.close();
      driver = null;
      logger.info('Neo4j: Disconnected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Neo4j: Disconnect error — ${message}`);
    }
  }
}
