import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 5000,
 clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chatdb'
  }
};
