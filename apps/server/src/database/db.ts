import { initSqliteDb, getDb, saveDb, startAutoSave } from '../config/database.js';
import { up } from './migrations/001_initial.js';
import { logger } from '../utils/logger.js';
import type { Database as SqlJsDatabase } from 'sql.js';

let dbInstance: SqlJsDatabase | null = null;

export async function initDatabase(): Promise<void> {
  try {
    logger.info('Initializing database...');
    dbInstance = await initSqliteDb();
    up(dbInstance);
    saveDb();
    startAutoSave();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize database');
    throw error;
  }
}

export function db(): SqlJsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

export { saveDb };
