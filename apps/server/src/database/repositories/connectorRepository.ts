import { db, saveDb } from '../db.js';
import { nanoid } from 'nanoid';
import type { Connector, ConnectorType } from '@urbanflow/shared';

export interface CreateConnectorInput {
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;
}

export interface UpdateConnectorInput {
  name?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
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

export const connectorRepository = {
  findAll(): Connector[] {
    const rows = queryAll(`SELECT * FROM connectors ORDER BY updated_at DESC`);
    return rows.map(mapRowToConnector);
  },

  findById(id: string): Connector | null {
    const row = queryOne(`SELECT * FROM connectors WHERE id = ?`, [id]);
    return row ? mapRowToConnector(row) : null;
  },

  findByType(type: ConnectorType): Connector[] {
    const rows = queryAll(`SELECT * FROM connectors WHERE type = ?`, [type]);
    return rows.map(mapRowToConnector);
  },

  findByName(name: string): Connector | null {
    const row = queryOne(`SELECT * FROM connectors WHERE name = ?`, [name]);
    return row ? mapRowToConnector(row) : null;
  },

  create(input: CreateConnectorInput): Connector {
    const id = nanoid();
    const now = new Date().toISOString();

    run(
      `INSERT INTO connectors (id, type, name, config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.type, input.name, JSON.stringify(input.config), now, now]
    );
    return this.findById(id)!;
  },

  update(id: string, input: UpdateConnectorInput): Connector | null {
    const connector = this.findById(id);
    if (!connector) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(input.config));
    }
    if (input.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(input.isActive ? 1 : 0);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    run(`UPDATE connectors SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const before = this.findById(id);
    if (!before) return false;
    run(`DELETE FROM connectors WHERE id = ?`, [id]);
    return true;
  },

  incrementUsageCount(id: string): void {
    run(
      `UPDATE connectors
       SET usage_count = usage_count + 1,
           last_used_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },
};

function mapRowToConnector(row: any): Connector {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    config: JSON.parse(row.config),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    usageCount: row.usage_count,
  };
}

export default connectorRepository;
