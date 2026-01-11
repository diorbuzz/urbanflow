import type { ExecutionStatus, WorkflowDefinition } from '@urbanflow/shared';

export interface ExecutionError {
  nodeId?: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

export class ExecutionContext {
  public readonly executionId: string;
  public readonly workflowId: string;
  public readonly workflow: WorkflowDefinition;
  public readonly triggerData: unknown;
  public readonly nodeOutputs: Map<string, unknown>;
  public readonly globalVariables: Map<string, unknown>;
  public status: ExecutionStatus;
  public errors: ExecutionError[];
  public readonly startedAt: Date;

  constructor(
    executionId: string,
    workflowId: string,
    workflow: WorkflowDefinition,
    triggerData: unknown,
    globalVariables?: Map<string, unknown>
  ) {
    this.executionId = executionId;
    this.workflowId = workflowId;
    this.workflow = workflow;
    this.triggerData = triggerData;
    this.nodeOutputs = new Map();
    this.globalVariables = globalVariables || new Map();
    this.status = 'pending';
    this.errors = [];
    this.startedAt = new Date();
  }

  setNodeOutput(nodeId: string, output: unknown): void {
    this.nodeOutputs.set(nodeId, output);
  }

  getNodeOutput(nodeId: string): unknown {
    return this.nodeOutputs.get(nodeId);
  }

  addError(error: ExecutionError): void {
    this.errors.push(error);
  }

  // 이전 노드들의 출력을 수집
  getInputData(nodeId: string): Record<string, unknown> {
    const node = this.workflow.nodes.find(n => n.id === nodeId);
    if (!node) return {};

    // 이 노드로 연결된 모든 엣지 찾기
    const incomingEdges = this.workflow.edges.filter(e => e.target === nodeId);

    const inputData: Record<string, unknown> = {
      trigger: this.triggerData,
    };

    for (const edge of incomingEdges) {
      const sourceOutput = this.nodeOutputs.get(edge.source);
      if (sourceOutput !== undefined) {
        inputData[edge.source] = sourceOutput;
      }
    }

    return inputData;
  }
}
