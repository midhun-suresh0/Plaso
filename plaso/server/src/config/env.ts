import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root (one level above server/)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

interface EnvConfig {
  // Server
  port: number;
  nodeEnv: string;

  // MongoDB
  mongodbUri: string;

  // Neo4j
  neo4jUri: string;
  neo4jUsername: string;
  neo4jPassword: string;

  // Maps / Location
  mapsApiKey: string;

  // Authentication
  jwtSecret: string;
  jwtExpiresIn: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
}

const env: EnvConfig = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || '',

  // Neo4j
  neo4jUri: process.env.NEO4J_URI || '',
  neo4jUsername: process.env.NEO4J_USERNAME || '',
  neo4jPassword: process.env.NEO4J_PASSWORD || '',

  // Maps / Location
  mapsApiKey: process.env.MAPS_API_KEY || '',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_for_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !env.RAZORPAY_WEBHOOK_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: Razorpay secrets are missing in production. Payments will fail.');
  } else {
    console.warn('⚠️ WARNING: Razorpay secrets are missing. Running without real payment capabilities.');
  }
}

export default env;
