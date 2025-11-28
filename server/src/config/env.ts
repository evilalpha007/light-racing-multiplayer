import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/racing',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-key',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

// Validate required environment variables
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be defined in production');
}

export default config;
