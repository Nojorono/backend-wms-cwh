import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env file explicitly with path
// Try multiple possible paths for .env file
const envPath = process.env.ENV_PATH || 
  join(process.cwd(), '.env') || 
  join(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: envPath });

const configService = new ConfigService();

// Get database config from environment variables
const dbHost = process.env.DB_HOST || configService.get('DB_HOST');
const dbPort = parseInt(process.env.DB_PORT || configService.get('DB_PORT') || '5432');
const dbUsername = process.env.DB_USERNAME || configService.get('DB_USERNAME');
const dbPassword = process.env.DB_PASSWORD || configService.get('DB_PASSWORD');
const dbDatabase = process.env.DB_DATABASE || configService.get('DB_DATABASE');

// Check if connecting to AWS RDS (requires SSL)
const isAwsRds = dbHost?.includes('rds.amazonaws.com') || false;
const requiresSSL = isAwsRds || process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbDatabase,
  entities: [join(__dirname, '..', '..', 'core', 'domain', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  ssl: requiresSSL ? {
    rejectUnauthorized: false,
  } : false,
  extra: {
    timezone: 'UTC',
  },
});
