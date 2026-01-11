import type {
  ConnectorDefinition,
  ConnectionTestResult,
  ConnectorActionResult,
} from '@urbanflow/shared';

export interface ConnectorConfig {
  [key: string]: unknown;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  // 연결 테스트
  abstract testConnection(): Promise<ConnectionTestResult>;

  // 액션 실행
  abstract executeAction(
    actionId: string,
    input: unknown
  ): Promise<ConnectorActionResult>;

  // 정리 (연결 종료 등)
  abstract dispose(): Promise<void>;

  // 커넥터 정의 반환 (static)
  static getDefinition(): ConnectorDefinition {
    throw new Error('Must be implemented by subclass');
  }
}

export default BaseConnector;
