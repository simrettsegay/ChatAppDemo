// This file is used by Prisma Migrate
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Export the database URL for Prisma Client
export const DATABASE_URL = process.env.DATABASE_URL;
