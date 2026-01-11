import { Router } from 'express';
import { db, saveDb } from '../database/db.js';
import { workflowRepository } from '../database/repositories/workflowRepository.js';
import { workflowExecutor } from '../engine/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

function queryOne(sql: string, params: any[] = []): any | null {
  const stmt = db().prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function run(sql: string, params: any[] = []): void {
  db().run(sql, params);
  saveDb();
}

// 동적 웹훅 엔드포인트
router.all('/:path', async (req, res) => {
  const { path } = req.params;

  // 웹훅 찾기
  const webhook = queryOne(
    `SELECT * FROM webhooks WHERE path = ? AND is_active = 1`,
    [path]
  );

  if (!webhook) {
    return res.status(404).json({ error: '웹훅을 찾을 수 없습니다' });
  }

  // HTTP 메서드 확인
  if (webhook.method !== req.method && webhook.method !== 'ANY') {
    return res.status(405).json({ error: `${webhook.method} 메서드만 허용됩니다` });
  }

  // 워크플로우 확인
  const workflow = workflowRepository.findById(webhook.workflow_id);
  if (!workflow || workflow.status !== 'active') {
    return res.status(400).json({ error: '워크플로우가 비활성화되어 있습니다' });
  }

  // 트리거 데이터 수집
  const triggerData = {
    trigger: 'webhook',
    webhookId: webhook.id,
    webhookPath: path,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  // 웹훅 통계 업데이트
  run(
    `UPDATE webhooks SET trigger_count = trigger_count + 1, last_triggered_at = datetime('now') WHERE id = ?`,
    [webhook.id]
  );

  logger.info({
    message: 'Webhook triggered',
    webhookPath: path,
    workflowId: workflow.id,
  });

  // 비동기로 워크플로우 실행 (응답은 바로 반환)
  workflowExecutor.execute(workflow.id, triggerData)
    .then((result) => {
      logger.info({
        message: 'Webhook workflow completed',
        webhookPath: path,
        executionId: result.executionId,
        status: result.status,
      });
    })
    .catch((error) => {
      logger.error({
        message: 'Webhook workflow failed',
        webhookPath: path,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  res.status(202).json({
    message: '워크플로우 실행이 시작되었습니다',
    workflowId: workflow.id,
  });
});

export default router;
