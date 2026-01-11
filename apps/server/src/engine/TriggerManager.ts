import cron from 'node-cron';
import { nanoid } from 'nanoid';
import { db, saveDb } from '../database/db.js';
import { workflowRepository } from '../database/repositories/workflowRepository.js';
import { workflowExecutor } from './WorkflowExecutor.js';
import { logger } from '../utils/logger.js';

interface ScheduledTask {
  workflowId: string;
  task: cron.ScheduledTask;
}

export class TriggerManager {
  private scheduledTasks: Map<string, ScheduledTask>;

  constructor() {
    this.scheduledTasks = new Map();
  }

  // 초기화 - 활성화된 스케줄 로드
  async initialize(): Promise<void> {
    logger.info('Initializing trigger manager...');
    await this.loadActiveSchedules();
    logger.info('Trigger manager initialized');
  }

  // 활성화된 스케줄 로드
  private async loadActiveSchedules(): Promise<void> {
    const schedules = this.queryAll(
      `SELECT s.*, w.name as workflow_name
       FROM schedules s
       JOIN workflows w ON s.workflow_id = w.id
       WHERE s.is_active = 1 AND w.status = 'active'`
    );

    for (const schedule of schedules) {
      try {
        this.startSchedule(
          schedule.id,
          schedule.workflow_id,
          schedule.cron_expression,
          schedule.timezone || 'Asia/Seoul'
        );
        logger.info({
          scheduleId: schedule.id,
          workflowName: schedule.workflow_name,
          cron: schedule.cron_expression,
        }, 'Schedule loaded');
      } catch (error) {
        logger.error({
          scheduleId: schedule.id,
          error: error instanceof Error ? error.message : String(error),
        }, 'Failed to load schedule');
      }
    }
  }

  // 스케줄 시작
  startSchedule(
    scheduleId: string,
    workflowId: string,
    cronExpression: string,
    timezone: string = 'Asia/Seoul'
  ): void {
    // 기존 스케줄 중지
    this.stopSchedule(scheduleId);

    // cron 표현식 검증
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // 스케줄 시작
    const task = cron.schedule(
      cronExpression,
      async () => {
        logger.info({ scheduleId, workflowId }, 'Cron trigger fired');

        try {
          // 워크플로우 확인
          const workflow = workflowRepository.findById(workflowId);
          if (!workflow || workflow.status !== 'active') {
            logger.warn({ workflowId }, 'Workflow not active, skipping execution');
            return;
          }

          // 워크플로우 실행
          const result = await workflowExecutor.execute(workflowId, {
            trigger: 'cron',
            scheduleId,
            cronExpression,
            firedAt: new Date().toISOString(),
          });

          // 스케줄 통계 업데이트
          this.run(
            `UPDATE schedules
             SET run_count = run_count + 1,
                 last_run_at = datetime('now'),
                 next_run_at = datetime('now', '+1 minute')
             WHERE id = ?`,
            [scheduleId]
          );

          logger.info({
            scheduleId,
            executionId: result.executionId,
            status: result.status,
          }, 'Scheduled workflow executed');
        } catch (error) {
          logger.error({
            scheduleId,
            workflowId,
            error: error instanceof Error ? error.message : String(error),
          }, 'Scheduled execution failed');
        }
      },
      {
        scheduled: true,
        timezone,
      }
    );

    this.scheduledTasks.set(scheduleId, { workflowId, task });
    logger.info({ scheduleId, workflowId, cronExpression }, 'Schedule started');
  }

  // 스케줄 중지
  stopSchedule(scheduleId: string): void {
    const scheduled = this.scheduledTasks.get(scheduleId);
    if (scheduled) {
      scheduled.task.stop();
      this.scheduledTasks.delete(scheduleId);
      logger.info({ scheduleId }, 'Schedule stopped');
    }
  }

  // 스케줄 생성
  createSchedule(
    workflowId: string,
    cronExpression: string,
    timezone: string = 'Asia/Seoul'
  ): string {
    // cron 표현식 검증
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const id = nanoid();

    this.run(
      `INSERT INTO schedules (id, workflow_id, cron_expression, timezone, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, datetime('now'))`,
      [id, workflowId, cronExpression, timezone]
    );

    // 바로 시작
    this.startSchedule(id, workflowId, cronExpression, timezone);

    return id;
  }

  // 스케줄 업데이트
  updateSchedule(
    scheduleId: string,
    cronExpression?: string,
    timezone?: string,
    isActive?: boolean
  ): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (cronExpression !== undefined) {
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }
      updates.push('cron_expression = ?');
      values.push(cronExpression);
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      values.push(timezone);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(scheduleId);
      this.run(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // 스케줄 재시작
    const schedule = this.queryOne('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
    if (schedule) {
      if (schedule.is_active) {
        this.startSchedule(
          schedule.id,
          schedule.workflow_id,
          schedule.cron_expression,
          schedule.timezone
        );
      } else {
        this.stopSchedule(scheduleId);
      }
    }
  }

  // 스케줄 삭제
  deleteSchedule(scheduleId: string): void {
    this.stopSchedule(scheduleId);
    this.run('DELETE FROM schedules WHERE id = ?', [scheduleId]);
  }

  // 웹훅 생성
  createWebhook(
    workflowId: string,
    method: string = 'POST'
  ): { id: string; path: string } {
    const id = nanoid();
    const path = nanoid(10); // 짧은 경로

    this.run(
      `INSERT INTO webhooks (id, workflow_id, path, method, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, datetime('now'))`,
      [id, workflowId, path, method]
    );

    logger.info({ webhookId: id, path, workflowId }, 'Webhook created');

    return { id, path };
  }

  // 웹훅 삭제
  deleteWebhook(webhookId: string): void {
    this.run('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    logger.info({ webhookId }, 'Webhook deleted');
  }

  // 모든 스케줄 중지
  stopAll(): void {
    for (const [scheduleId] of this.scheduledTasks) {
      this.stopSchedule(scheduleId);
    }
    logger.info('All schedules stopped');
  }

  // DB 헬퍼
  private queryAll(sql: string, params: any[] = []): any[] {
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

  private queryOne(sql: string, params: any[] = []): any | null {
    const results = this.queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  private run(sql: string, params: any[] = []): void {
    db().run(sql, params);
    saveDb();
  }
}

// 싱글톤 인스턴스
export const triggerManager = new TriggerManager();
