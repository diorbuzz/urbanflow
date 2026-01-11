import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './database/db.js';
import { triggerManager } from './engine/index.js';
import { wsManager } from './websocket.js';
import { logger } from './utils/logger.js';

async function main() {
  // 데이터베이스 초기화
  await initDatabase();

  // 트리거 매니저 초기화 (Cron 스케줄 로드)
  await triggerManager.initialize();

  // HTTP 서버 생성
  const server = createServer(app);

  // WebSocket 서버 초기화
  wsManager.initialize(server);

  // 서버 시작
  server.listen(env.PORT, () => {
    logger.info(`UrbanFlow Server is running on http://localhost:${env.PORT}`);
    logger.info(`API: http://localhost:${env.PORT}/api`);
    logger.info(`WebSocket: ws://localhost:${env.PORT}/ws`);
    logger.info(`Webhooks: http://localhost:${env.PORT}/webhook/:path`);
  });
}

main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// 종료 핸들링
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  triggerManager.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  triggerManager.stopAll();
  process.exit(0);
});
