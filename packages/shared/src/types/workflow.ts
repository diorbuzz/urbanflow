// 워크플로우 관련 타입 정의

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export type WorkflowStatus = 'active' | 'inactive' | 'error';
export type TriggerType = 'webhook' | 'cron' | 'manual';

export interface TriggerConfig {
  // Webhook
  webhookPath?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  webhookSecret?: string;
  // Cron
  cronExpression?: string;
  timezone?: string;
}

// 노드 타입 정의
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'delay'
  | 'data-mapper'
  | 'connector';

export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  config: Record<string, unknown>;
  inputMapping?: DataMapping[];
  outputMapping?: DataMapping[];
  errorHandling?: ErrorHandlingConfig;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
}

export interface ErrorHandlingConfig {
  retryCount: number;
  retryDelay: number;
  fallbackAction?: 'skip' | 'stop' | 'continue';
}

// 엣지 타입 정의
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'conditional';
  label?: string;
  data?: {
    condition?: string;
  };
}

// 워크플로우 버전
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  createdAt: string;
}
