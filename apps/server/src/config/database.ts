import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { env } from './env.js';

let db: SqlJsDatabase | null = null;

// 데이터 디렉토리 생성
const dataDir = path.dirname(env.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 로그 디렉토리 생성
const logDir = path.join(dataDir, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export async function initSqliteDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  // 기존 DB 파일이 있으면 로드
  if (fs.existsSync(env.DB_PATH)) {
    const buffer = fs.readFileSync(env.DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // WAL 모드는 sql.js에서 지원하지 않으므로 생략
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initSqliteDb() first.');
  }
  return db;
}

export function saveDb(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(env.DB_PATH, buffer);
  }
}

// 자동 저장 (5초마다)
let saveInterval: NodeJS.Timeout | null = null;

export function startAutoSave(): void {
  if (saveInterval) return;
  saveInterval = setInterval(() => {
    saveDb();
  }, 5000);
}

export function stopAutoSave(): void {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
}

export { db };
export default { initSqliteDb, getDb, saveDb, startAutoSave, stopAutoSave };
