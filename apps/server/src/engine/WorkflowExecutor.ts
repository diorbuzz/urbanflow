import type { WorkflowNode, WorkflowEdge, ExecutionStatus } from '@urbanflow/shared';
import { ExecutionContext } from './ExecutionContext.js';
import { NodeExecutor } from './NodeExecutor.js';
import { workflowRepository } from '../database/repositories/workflowRepository.js';
import { executionRepository } from '../database/repositories/executionRepository.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  outputs: Record<string, unknown>;
  errors: Array<{ nodeId?: string; message: string }>;
  durationMs: number;
}

export class WorkflowExecutor extends EventEmitter {
  private nodeExecutor: NodeExecutor;
  private runningExecutions: Map<string, ExecutionContext>;

  constructor() {
    super();
    this.nodeExecutor = new NodeExecutor();
    this.runningExecutions = new Map();
  }

  async execute(
    workflowId: string,
    triggerData: unknown,
    executionId?: string
  ): Promise<ExecutionResult> {
    // 워크플로우 로드
    const workflow = workflowRepository.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 실행 기록 생성 또는 가져오기
    let execution;
    if (executionId) {
      execution = executionRepository.findById(executionId);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }
    } else {
      execution = executionRepository.create({
        workflowId,
        triggerType: 'manual',
        triggerData,
      });
    }

    // 실행 컨텍스트 생성
    const context = new ExecutionContext(
      execution.id,
      workflowId,
      workflow.definition,
      triggerData
    );

    this.runningExecutions.set(execution.id, context);

    // 상태 업데이트
    context.status = 'running';
    executionRepository.updateStatus(execution.id, 'running');
    this.emit('execution:started', { executionId: execution.id, workflowId });

    logger.info({ executionId: execution.id, workflowId }, 'Workflow execution started');

    try {
      // 시작 노드 찾기 (트리거 노드)
      const startNodes = this.findStartNodes(workflow.definition.nodes, workflow.definition.edges);

      if (startNodes.length === 0) {
        throw new Error('No start node found in workflow');
      }

      // 각 시작 노드부터 실행
      for (const startNode of startNodes) {
        await this.executeFromNode(startNode.id, context);
      }

      // 성공 완료
      context.status = 'completed';
      executionRepository.updateStatus(execution.id, 'completed');
      workflowRepository.incrementExecutionCount(workflowId);

      this.emit('execution:completed', {
        executionId: execution.id,
        outputs: Object.fromEntries(context.nodeOutputs),
      });

      logger.info({ executionId: execution.id }, 'Workflow execution completed');
    } catch (error) {
      // 실패 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.status = 'failed';
      context.addError({ message: errorMessage, timestamp: new Date() });
      executionRepository.updateStatus(execution.id, 'failed', errorMessage);

      this.emit('execution:failed', {
        executionId: execution.id,
        error: errorMessage,
      });

      logger.error({ executionId: execution.id, error: errorMessage }, 'Workflow execution failed');
    } finally {
      this.runningExecutions.delete(execution.id);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - context.startedAt.getTime();

    return {
      executionId: execution.id,
      status: context.status,
      outputs: Object.fromEntries(context.nodeOutputs),
      errors: context.errors.map(e => ({ nodeId: e.nodeId, message: e.message })),
      durationMs,
    };
  }

  private async executeFromNode(
    nodeId: string,
    context: ExecutionContext
  ): Promise<void> {
    const node = context.workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // 노드 실행 로그 생성
    const logId = executionRepository.createNodeLog({
      executionId: context.executionId,
      nodeId: node.id,
      nodeType: node.type,
    });

    // 노드 시작 이벤트
    this.emit('node:started', {
      executionId: context.executionId,
      nodeId: node.id,
      nodeType: node.type,
    });

    executionRepository.updateNodeLog(logId, 'running');

    try {
      // 노드 실행
      const inputData = context.getInputData(nodeId);
      const result = await this.nodeExecutor.execute(node, context);

      if (!result.success) {
        throw new Error(result.error || 'Node execution failed');
      }

      // 출력 저장
      context.setNodeOutput(nodeId, result.output);

      // 로그 업데이트
      executionRepository.updateNodeLog(logId, 'completed', inputData, result.output);

      // 노드 완료 이벤트
      this.emit('node:completed', {
        executionId: context.executionId,
        nodeId: node.id,
        output: result.output,
      });

      logger.debug({ nodeId, output: result.output }, 'Node execution completed');

      // 다음 노드들 찾기
      const nextNodes = this.getNextNodes(node, result.nextPath, context);

      // 다음 노드들 실행
      if (nextNodes.length === 1) {
        // 순차 실행
        await this.executeFromNode(nextNodes[0], context);
      } else if (nextNodes.length > 1) {
        // 병렬 실행
        await Promise.all(
          nextNodes.map(nextId => this.executeFromNode(nextId, context))
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 로그 업데이트
      executionRepository.updateNodeLog(logId, 'failed', undefined, undefined, errorMessage);

      // 노드 실패 이벤트
      this.emit('node:failed', {
        executionId: context.executionId,
        nodeId: node.id,
        error: errorMessage,
      });

      // 에러 핸들링
      const errorHandling = node.data.errorHandling;
      if (errorHandling?.fallbackAction === 'continue') {
        logger.warn({ nodeId, error: errorMessage }, 'Node failed but continuing');
        context.addError({ nodeId, message: errorMessage, timestamp: new Date() });
      } else if (errorHandling?.fallbackAction === 'skip') {
        logger.warn({ nodeId, error: errorMessage }, 'Node failed, skipping');
        // 다음 노드로 진행
        const nextNodes = this.getNextNodes(node, undefined, context);
        for (const nextId of nextNodes) {
          await this.executeFromNode(nextId, context);
        }
      } else {
        // 기본: 실행 중단
        throw error;
      }
    }
  }

  // 시작 노드 찾기 (들어오는 엣지가 없는 노드)
  private findStartNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const targetNodeIds = new Set(edges.map(e => e.target));
    return nodes.filter(n => !targetNodeIds.has(n.id));
  }

  // 다음 노드 찾기
  private getNextNodes(
    node: WorkflowNode,
    nextPath: string | undefined,
    context: ExecutionContext
  ): string[] {
    const edges = context.workflow.edges.filter(e => e.source === node.id);

    if (node.type === 'condition' && nextPath) {
      // 조건 노드: 특정 경로의 엣지만 선택
      const matchingEdges = edges.filter(e => e.sourceHandle === nextPath);
      return matchingEdges.map(e => e.target);
    }

    // 기본: 모든 나가는 엣지
    return edges.map(e => e.target);
  }

  // 실행 취소
  cancelExecution(executionId: string): boolean {
    const context = this.runningExecutions.get(executionId);
    if (!context) {
      return false;
    }

    context.status = 'cancelled';
    executionRepository.updateStatus(executionId, 'cancelled');
    this.runningExecutions.delete(executionId);

    this.emit('execution:cancelled', { executionId });

    return true;
  }

  // 실행 중인 워크플로우 확인
  isRunning(executionId: string): boolean {
    return this.runningExecutions.has(executionId);
  }
}

// 싱글톤 인스턴스
export const workflowExecutor = new WorkflowExecutor();
