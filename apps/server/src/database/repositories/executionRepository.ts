import { db, saveDb } from '../db.js';
import { nanoid } from 'nanoid';
import type { Execution, ExecutionStatus, NodeExecutionLog, NodeExecutionStatus } from '@urbanflow/shared';

export interface CreateExecutionInput {
  workflowId: string;
  triggerType: 'webhook' | 'cron' | 'manual';
  triggerData?: unknown;
}

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

function run(sql: string, params: any[] = []): void {
  db().run(sql, params);
  saveDb();
}

export const executionRepository = {
  findAll(limit = 100, offset = 0): Execution[] {
    const rows = queryAll(
      `SELECT * FROM executions ORDER BY started_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map(mapRowToExecution);
  },

  findById(id: string): Execution | null {
    const row = queryOne(`SELECT * FROM executions WHERE id = ?`, [id]);
    return row ? mapRowToExecution(row) : null;
  },

  findByWorkflowId(workflowId: string, limit = 50): Execution[] {
    const rows = queryAll(
      `SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?`,
      [workflowId, limit]
    );
    return rows.map(mapRowToExecution);
  },

  findByStatus(status: ExecutionStatus): Execution[] {
    const rows = queryAll(`SELECT * FROM executions WHERE status = ?`, [status]);
    return rows.map(mapRowToExecution);
  },

  create(input: CreateExecutionInput): Execution {
    const id = nanoid();
    const now = new Date().toISOString();

    run(
      `INSERT INTO executions (id, workflow_id, status, trigger_type, trigger_data, started_at)
       VALUES (?, ?, 'pending', ?, ?, ?)`,
      [
        id,
        input.workflowId,
        input.triggerType,
        input.triggerData ? JSON.stringify(input.triggerData) : null,
        now
      ]
    );

    return this.findById(id)!;
  },

  updateStatus(id: string, status: ExecutionStatus, errorMessage?: string): void {
    const execution = this.findById(id);
    if (!execution) return;

    const now = new Date();
    const startedAt = new Date(execution.startedAt);
    const durationMs = now.getTime() - startedAt.getTime();

    if (status === 'running') {
      run(`UPDATE executions SET status = ? WHERE id = ?`, [status, id]);
    } else {
      run(
        `UPDATE executions SET status = ?, finished_at = ?, duration_ms = ?, error_message = ? WHERE id = ?`,
        [status, now.toISOString(), durationMs, errorMessage || null, id]
      );
    }
  },

  delete(id: string): boolean {
    const before = this.findById(id);
    if (!before) return false;
    run(`DELETE FROM executions WHERE id = ?`, [id]);
    return true;
  },

  cleanupOld(retentionDays: number): number {
    const before = queryAll(`SELECT id FROM executions WHERE started_at < datetime('now', '-' || ? || ' days')`, [retentionDays]);
    run(`DELETE FROM executions WHERE started_at < datetime('now', '-' || ? || ' days')`, [retentionDays]);
    return before.length;
  },

  createNodeLog(input: { executionId: string; nodeId: string; nodeType: string }): string {
    const id = nanoid();
    run(
      `INSERT INTO node_execution_logs (id, execution_id, node_id, node_type, status, started_at)
       VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
      [id, input.executionId, input.nodeId, input.nodeType]
    );
    return id;
  },

  updateNodeLog(
    id: string,
    status: NodeExecutionStatus,
    inputData?: unknown,
    outputData?: unknown,
    errorMessage?: string
  ): void {
    run(
      `UPDATE node_execution_logs
       SET status = ?, input_data = ?, output_data = ?, error_message = ?,
           finished_at = CASE WHEN ? != 'running' THEN datetime('now') ELSE finished_at END
       WHERE id = ?`,
      [
        status,
        inputData ? JSON.stringify(inputData) : null,
        outputData ? JSON.stringify(outputData) : null,
        errorMessage || null,
        status,
        id
      ]
    );
  },

  getNodeLogs(executionId: string): NodeExecutionLog[] {
    const rows = queryAll(
      `SELECT * FROM node_execution_logs WHERE execution_id = ? ORDER BY started_at ASC`,
      [executionId]
    );
    return rows.map(mapRowToNodeLog);
  },
};

function mapRowToExecution(row: any): Execution {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status,
    triggerType: row.trigger_type,
    triggerData: row.trigger_data ? JSON.parse(row.trigger_data) : undefined,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    errorMessage: row.error_message,
  };
}

function mapRowToNodeLog(row: any): NodeExecutionLog {
  return {
    id: row.id,
    executionId: row.execution_id,
    nodeId: row.node_id,
    nodeType: row.node_type,
    status: row.status,
    inputData: row.input_data ? JSON.parse(row.input_data) : undefined,
    outputData: row.output_data ? JSON.parse(row.output_data) : undefined,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    retryCount: row.retry_count,
  };
}

export default executionRepository;
