import type { Database as SqlJsDatabase } from 'sql.js';

export function up(db: SqlJsDatabase): void {
  // 워크플로우 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      definition TEXT NOT NULL,
      status TEXT DEFAULT 'inactive',
      trigger_type TEXT,
      trigger_config TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_executed_at TEXT,
      execution_count INTEGER DEFAULT 0
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at)`);

  // 워크플로우 버전 히스토리
  db.run(`
    CREATE TABLE IF NOT EXISTS workflow_versions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      definition TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_workflow_versions ON workflow_versions(workflow_id, version)`);

  // 실행 이력 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_data TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      duration_ms INTEGER,
      error_message TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at DESC)`);

  // 노드 실행 로그 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS node_execution_logs (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      node_type TEXT NOT NULL,
      status TEXT NOT NULL,
      input_data TEXT,
      output_data TEXT,
      error_message TEXT,
      started_at TEXT,
      finished_at TEXT,
      duration_ms INTEGER,
      retry_count INTEGER DEFAULT 0,
      FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_node_logs_execution ON node_execution_logs(execution_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_node_logs_node ON node_execution_logs(node_id)`);

  // 커넥터 설정 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_used_at TEXT,
      usage_count INTEGER DEFAULT 0
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_connectors_type ON connectors(type)`);

  // 웹훅 엔드포인트 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL UNIQUE,
      method TEXT DEFAULT 'POST',
      is_active INTEGER DEFAULT 1,
      secret TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_triggered_at TEXT,
      trigger_count INTEGER DEFAULT 0,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  // 스케줄 테이블 (Cron 트리거)
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL UNIQUE,
      cron_expression TEXT NOT NULL,
      timezone TEXT DEFAULT 'Asia/Seoul',
      is_active INTEGER DEFAULT 1,
      next_run_at TEXT,
      last_run_at TEXT,
      run_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run_at)`);

  // 글로벌 변수/설정 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS global_variables (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      is_secret INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 시스템 설정 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 기본 설정 삽입
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('execution.max_concurrent', '5')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('execution.timeout_ms', '300000')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('execution.retry_count', '3')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('log.retention_days', '30')`);
}

export function down(db: SqlJsDatabase): void {
  db.run(`DROP TABLE IF EXISTS settings`);
  db.run(`DROP TABLE IF EXISTS global_variables`);
  db.run(`DROP TABLE IF EXISTS schedules`);
  db.run(`DROP TABLE IF EXISTS webhooks`);
  db.run(`DROP TABLE IF EXISTS connectors`);
  db.run(`DROP TABLE IF EXISTS node_execution_logs`);
  db.run(`DROP TABLE IF EXISTS executions`);
  db.run(`DROP TABLE IF EXISTS workflow_versions`);
  db.run(`DROP TABLE IF EXISTS workflows`);
}
