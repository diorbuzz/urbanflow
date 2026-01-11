import { Router } from 'express';
import { triggerManager } from '../engine/index.js';
import { db, saveDb } from '../database/db.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// DB 헬퍼
function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db().prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// =====================
// 스케줄 API
// =====================

// 모든 스케줄 조회
router.get('/schedules', (req, res) => {
  const schedules = queryAll(`
    SELECT s.*, w.name as workflow_name
    FROM schedules s
    LEFT JOIN workflows w ON s.workflow_id = w.id
    ORDER BY s.created_at DESC
  `);
  res.json(schedules);
});

// 워크플로우의 스케줄 조회
router.get('/workflows/:workflowId/schedules', (req, res) => {
  const schedules = queryAll(
    'SELECT * FROM schedules WHERE workflow_id = ?',
    [req.params.workflowId]
  );
  res.json(schedules);
});

// 스케줄 생성
router.post('/schedules', (req, res, next) => {
  const { workflowId, cronExpression, timezone = 'Asia/Seoul' } = req.body;

  if (!workflowId) {
    return next(badRequest('워크플로우 ID는 필수입니다'));
  }
  if (!cronExpression) {
    return next(badRequest('Cron 표현식은 필수입니다'));
  }

  try {
    const scheduleId = triggerManager.createSchedule(workflowId, cronExpression, timezone);
    const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
});

// 스케줄 수정
router.put('/schedules/:id', (req, res, next) => {
  const { cronExpression, timezone, isActive } = req.body;

  try {
    triggerManager.updateSchedule(req.params.id, cronExpression, timezone, isActive);
    const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) {
      return next(notFound('스케줄을 찾을 수 없습니다'));
    }
    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

// 스케줄 삭제
router.delete('/schedules/:id', (req, res, next) => {
  try {
    triggerManager.deleteSchedule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// =====================
// 웹훅 API
// =====================

// 모든 웹훅 조회
router.get('/webhooks', (req, res) => {
  const webhooks = queryAll(`
    SELECT wh.*, w.name as workflow_name
    FROM webhooks wh
    LEFT JOIN workflows w ON wh.workflow_id = w.id
    ORDER BY wh.created_at DESC
  `);
  res.json(webhooks);
});

// 워크플로우의 웹훅 조회
router.get('/workflows/:workflowId/webhooks', (req, res) => {
  const webhooks = queryAll(
    'SELECT * FROM webhooks WHERE workflow_id = ?',
    [req.params.workflowId]
  );
  res.json(webhooks);
});

// 웹훅 생성
router.post('/webhooks', (req, res, next) => {
  const { workflowId, method = 'POST' } = req.body;

  if (!workflowId) {
    return next(badRequest('워크플로우 ID는 필수입니다'));
  }

  try {
    const { id, path } = triggerManager.createWebhook(workflowId, method);
    const webhook = queryOne('SELECT * FROM webhooks WHERE id = ?', [id]);
    res.status(201).json({
      ...webhook,
      fullUrl: `/webhook/${path}`,
    });
  } catch (error) {
    next(error);
  }
});

// 웹훅 활성화/비활성화
router.put('/webhooks/:id', (req, res, next) => {
  const { isActive } = req.body;

  try {
    db().run(
      'UPDATE webhooks SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, req.params.id]
    );
    saveDb();

    const webhook = queryOne('SELECT * FROM webhooks WHERE id = ?', [req.params.id]);
    if (!webhook) {
      return next(notFound('웹훅을 찾을 수 없습니다'));
    }
    res.json(webhook);
  } catch (error) {
    next(error);
  }
});

// 웹훅 삭제
router.delete('/webhooks/:id', (req, res, next) => {
  try {
    triggerManager.deleteWebhook(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
