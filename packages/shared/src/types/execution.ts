// 실행 관련 타입 정의

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  triggerType: 'webhook' | 'cron' | 'manual';
  triggerData?: unknown;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface NodeExecutionLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: NodeExecutionStatus;
  inputData?: unknown;
  outputData?: unknown;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  retryCount: number;
}

export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

// 실행 컨텍스트 (런타임)
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  triggerData: unknown;
  nodeOutputs: Map<string, unknown>;
  globalVariables: Map<string, unknown>;
  status: ExecutionStatus;
  errors: ExecutionError[];
  startedAt: Date;
}

export interface ExecutionError {
  nodeId?: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

// 실행 결과
export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  outputs: Record<string, unknown>;
  errors: ExecutionError[];
  durationMs: number;
}

// 노드 실행 결과
export interface NodeExecutionResult {
  success: boolean;
  output: unknown;
  nextPath?: string;
  error?: string;
}

// WebSocket 이벤트
export interface ExecutionEvent {
  type: ExecutionEventType;
  executionId: string;
  nodeId?: string;
  data?: unknown;
  timestamp: string;
}

export type ExecutionEventType =
  | 'execution:started'
  | 'execution:completed'
  | 'execution:failed'
  | 'execution:cancelled'
  | 'node:started'
  | 'node:completed'
  | 'node:failed'
  | 'node:skipped';
