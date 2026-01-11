import { db, saveDb } from '../db.js';
import { nanoid } from 'nanoid';
import type { Workflow, WorkflowDefinition, WorkflowStatus, TriggerType, TriggerConfig } from '@urbanflow/shared';

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  status?: WorkflowStatus;
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;
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

export const workflowRepository = {
  findAll(): Workflow[] {
    const rows = queryAll(`SELECT * FROM workflows ORDER BY updated_at DESC`);
    return rows.map(mapRowToWorkflow);
  },

  findById(id: string): Workflow | null {
    const row = queryOne(`SELECT * FROM workflows WHERE id = ?`, [id]);
    return row ? mapRowToWorkflow(row) : null;
  },

  findByStatus(status: WorkflowStatus): Workflow[] {
    const rows = queryAll(`SELECT * FROM workflows WHERE status = ?`, [status]);
    return rows.map(mapRowToWorkflow);
  },

  create(input: CreateWorkflowInput): Workflow {
    const id = nanoid();
    const now = new Date().toISOString();

    run(
      `INSERT INTO workflows (id, name, description, definition, trigger_type, trigger_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description || null,
        JSON.stringify(input.definition),
        input.triggerType || null,
        input.triggerConfig ? JSON.stringify(input.triggerConfig) : null,
        now,
        now
      ]
    );

    return this.findById(id)!;
  },

  update(id: string, input: UpdateWorkflowInput): Workflow | null {
    const workflow = this.findById(id);
    if (!workflow) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.definition !== undefined) {
      updates.push('definition = ?');
      values.push(JSON.stringify(input.definition));
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.triggerType !== undefined) {
      updates.push('trigger_type = ?');
      values.push(input.triggerType);
    }
    if (input.triggerConfig !== undefined) {
      updates.push('trigger_config = ?');
      values.push(JSON.stringify(input.triggerConfig));
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    run(`UPDATE workflows SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const before = this.findById(id);
    if (!before) return false;
    run(`DELETE FROM workflows WHERE id = ?`, [id]);
    return true;
  },

  incrementExecutionCount(id: string): void {
    run(
      `UPDATE workflows
       SET execution_count = execution_count + 1,
           last_executed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },

  duplicate(id: string): Workflow | null {
    const original = this.findById(id);
    if (!original) return null;

    return this.create({
      name: `${original.name} (복사본)`,
      description: original.description,
      definition: original.definition,
      triggerType: original.triggerType,
      triggerConfig: original.triggerConfig,
    });
  },
};

function mapRowToWorkflow(row: any): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    definition: JSON.parse(row.definition),
    status: row.status,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config ? JSON.parse(row.trigger_config) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastExecutedAt: row.last_executed_at,
    executionCount: row.execution_count,
  };
}

export default workflowRepository;
