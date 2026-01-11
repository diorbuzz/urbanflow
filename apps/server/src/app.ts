import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import workflowRoutes from './routes/workflows.js';
import executionRoutes from './routes/executions.js';
import connectorRoutes from './routes/connectors.js';
import triggerRoutes from './routes/triggers.js';
import webhookRoutes from './routes/webhook.js';
import systemRoutes from './routes/system.js';

const app = express();

// 미들웨어
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// API 라우트
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/connectors', connectorRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api', systemRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use(errorHandler);

export default app;
