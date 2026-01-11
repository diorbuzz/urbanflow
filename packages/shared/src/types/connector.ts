// 커넥터 관련 타입 정의

export interface Connector {
  id: string;
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export type ConnectorType =
  | 'slack'
  | 'discord'
  | 'telegram'
  | 'kakao'
  | 'mysql'
  | 'postgresql'
  | 'mongodb'
  | 'custom_api';

export type ConnectorCategory = 'messenger' | 'database' | 'api' | 'utility';

export interface ConnectorDefinition {
  id: string;
  type: ConnectorType;
  name: string;
  description: string;
  icon: string;
  category: ConnectorCategory;
  configSchema: ConnectorConfigField[];
  actions: ConnectorAction[];
  triggers?: ConnectorTrigger[];
}

export interface ConnectorConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string }[];
}

export interface ConnectorAction {
  id: string;
  name: string;
  description: string;
  inputFields: ConnectorField[];
  outputFields: ConnectorField[];
}

export interface ConnectorTrigger {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling';
  outputFields: ConnectorField[];
}

export interface ConnectorField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

// 커넥터 연결 테스트 결과
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

// 커넥터 액션 실행 결과
export interface ConnectorActionResult {
  success: boolean;
  data: unknown;
  error?: string;
}

// 웹훅 정의
export interface Webhook {
  id: string;
  workflowId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isActive: boolean;
  secret?: string;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

// 스케줄 정의
export interface Schedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  runCount: number;
  createdAt: string;
}

// 글로벌 변수
export interface GlobalVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}
