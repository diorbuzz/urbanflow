// 노드 타입 상수
export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  LOOP: 'loop',
  DELAY: 'delay',
  DATA_MAPPER: 'data-mapper',
  CONNECTOR: 'connector',
} as const;

// 커넥터 타입 상수
export const CONNECTOR_TYPES = {
  SLACK: 'slack',
  DISCORD: 'discord',
  TELEGRAM: 'telegram',
  KAKAO: 'kakao',
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  MONGODB: 'mongodb',
  CUSTOM_API: 'custom_api',
} as const;

// 커넥터 카테고리
export const CONNECTOR_CATEGORIES = {
  MESSENGER: 'messenger',
  DATABASE: 'database',
  API: 'api',
  UTILITY: 'utility',
} as const;

// 실행 상태
export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// 워크플로우 상태
export const WORKFLOW_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
} as const;

// 트리거 타입
export const TRIGGER_TYPES = {
  WEBHOOK: 'webhook',
  CRON: 'cron',
  MANUAL: 'manual',
} as const;

// 기본 설정값
export const DEFAULT_SETTINGS = {
  EXECUTION_MAX_CONCURRENT: 5,
  EXECUTION_TIMEOUT_MS: 300000, // 5분
  EXECUTION_RETRY_COUNT: 3,
  LOG_RETENTION_DAYS: 30,
} as const;

// API 경로
export const API_ROUTES = {
  WORKFLOWS: '/api/workflows',
  EXECUTIONS: '/api/executions',
  CONNECTORS: '/api/connectors',
  WEBHOOKS: '/api/webhooks',
  SCHEDULES: '/api/schedules',
  SETTINGS: '/api/settings',
  VARIABLES: '/api/variables',
  HEALTH: '/api/health',
  STATS: '/api/stats',
} as const;

// WebSocket 이벤트
export const WS_EVENTS = {
  SUBSCRIBE_EXECUTION: 'subscribe:execution',
  UNSUBSCRIBE_EXECUTION: 'unsubscribe:execution',
  EXECUTION_STARTED: 'execution:started',
  EXECUTION_COMPLETED: 'execution:completed',
  EXECUTION_FAILED: 'execution:failed',
  EXECUTION_CANCELLED: 'execution:cancelled',
  NODE_STARTED: 'node:started',
  NODE_COMPLETED: 'node:completed',
  NODE_FAILED: 'node:failed',
  NODE_SKIPPED: 'node:skipped',
} as const;
