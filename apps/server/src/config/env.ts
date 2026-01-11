import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../../');

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // 데이터베이스
  DB_PATH: process.env.DB_PATH || path.join(rootDir, 'data', 'urbanflow.db'),

  // 실행 설정
  EXECUTION_MAX_CONCURRENT: parseInt(process.env.EXECUTION_MAX_CONCURRENT || '5', 10),
  EXECUTION_TIMEOUT_MS: parseInt(process.env.EXECUTION_TIMEOUT_MS || '300000', 10),
  EXECUTION_RETRY_COUNT: parseInt(process.env.EXECUTION_RETRY_COUNT || '3', 10),

  // 로그
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // 웹훅
  WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL || 'http://localhost:3001',
};

export default env;
