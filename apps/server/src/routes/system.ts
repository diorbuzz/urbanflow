import { Router } from 'express';
import { db, saveDb } from '../database/db.js';
import { workflowRepository } from '../database/repositories/workflowRepository.js';
import { executionRepository } from '../database/repositories/executionRepository.js';

const router = Router();

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

function run(sql: string, params: any[] = []): void {
  db().run(sql, params);
  saveDb();
}

// 대시보드 통계
router.get('/stats', (req, res) => {
  const workflows = workflowRepository.findAll();
  const activeWorkflows = workflows.filter(w => w.status === 'active');

  // 최근 실행 통계
  const recentExecutions = executionRepository.findAll(100, 0);
  const completedCount = recentExecutions.filter(e => e.status === 'completed').length;
  const failedCount = recentExecutions.filter(e => e.status === 'failed').length;
  const runningCount = recentExecutions.filter(e => e.status === 'running').length;

  res.json({
    workflows: {
      total: workflows.length,
      active: activeWorkflows.length,
      inactive: workflows.length - activeWorkflows.length,
    },
    executions: {
      total: recentExecutions.length,
      completed: completedCount,
      failed: failedCount,
      running: runningCount,
      successRate: recentExecutions.length > 0
        ? Math.round((completedCount / recentExecutions.length) * 100)
        : 0,
    },
  });
});

// 시스템 설정 조회
router.get('/settings', (req, res) => {
  const rows = queryAll('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// 시스템 설정 수정
router.put('/settings', (req, res) => {
  const settings = req.body as Record<string, string>;

  for (const [key, value] of Object.entries(settings)) {
    run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      [key, value]
    );
  }

  res.json({ message: '설정이 저장되었습니다' });
});

// 글로벌 변수 목록
router.get('/variables', (req, res) => {
  const variables = queryAll('SELECT * FROM global_variables ORDER BY key');
  res.json(variables);
});

// 글로벌 변수 추가
router.post('/variables', (req, res) => {
  const { key, value, description, isSecret } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'key와 value는 필수입니다' });
  }

  const id = Date.now().toString(36);
  run(
    `INSERT INTO global_variables (id, key, value, description, is_secret) VALUES (?, ?, ?, ?, ?)`,
    [id, key, value, description || null, isSecret ? 1 : 0]
  );

  res.status(201).json({ id, key, value, description, isSecret });
});

// 글로벌 변수 수정
router.put('/variables/:id', (req, res) => {
  const { value, description, isSecret } = req.body;

  run(
    `UPDATE global_variables SET value = ?, description = ?, is_secret = ?, updated_at = datetime('now') WHERE id = ?`,
    [value, description || null, isSecret ? 1 : 0, req.params.id]
  );

  res.json({ message: '변수가 수정되었습니다' });
});

// 글로벌 변수 삭제
router.delete('/variables/:id', (req, res) => {
  run('DELETE FROM global_variables WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
