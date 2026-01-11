import type { ConnectorDefinition } from '@urbanflow/shared';

// 커넥터 정의 목록
const connectorDefinitions: ConnectorDefinition[] = [
  // Slack
  {
    id: 'slack',
    type: 'slack',
    name: 'Slack',
    description: 'Slack 메시지 전송 및 채널 관리',
    icon: 'slack',
    category: 'messenger',
    configSchema: [
      {
        name: 'token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        placeholder: 'xoxb-...',
        description: 'Slack Bot User OAuth Token',
      },
    ],
    actions: [
      {
        id: 'send_message',
        name: '메시지 전송',
        description: '채널에 메시지를 전송합니다',
        inputFields: [
          { name: 'channel', label: '채널', type: 'string', required: true },
          { name: 'text', label: '메시지', type: 'string', required: true },
        ],
        outputFields: [
          { name: 'ts', label: '메시지 ID', type: 'string', required: true },
          { name: 'channel', label: '채널', type: 'string', required: true },
        ],
      },
    ],
  },

  // Discord
  {
    id: 'discord',
    type: 'discord',
    name: 'Discord',
    description: 'Discord 메시지 전송',
    icon: 'discord',
    category: 'messenger',
    configSchema: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'password',
        required: true,
        description: 'Discord Webhook URL',
      },
    ],
    actions: [
      {
        id: 'send_message',
        name: '메시지 전송',
        description: 'Webhook으로 메시지를 전송합니다',
        inputFields: [
          { name: 'content', label: '내용', type: 'string', required: true },
          { name: 'username', label: '사용자명', type: 'string', required: false },
        ],
        outputFields: [
          { name: 'success', label: '성공 여부', type: 'boolean', required: true },
        ],
      },
    ],
  },

  // Telegram
  {
    id: 'telegram',
    type: 'telegram',
    name: 'Telegram',
    description: 'Telegram 메시지 전송',
    icon: 'telegram',
    category: 'messenger',
    configSchema: [
      {
        name: 'botToken',
        label: 'Bot Token',
        type: 'password',
        required: true,
        description: 'Telegram Bot Token',
      },
      {
        name: 'chatId',
        label: 'Chat ID',
        type: 'text',
        required: true,
        description: '메시지를 보낼 채팅 ID',
      },
    ],
    actions: [
      {
        id: 'send_message',
        name: '메시지 전송',
        description: '텔레그램 메시지를 전송합니다',
        inputFields: [
          { name: 'text', label: '메시지', type: 'string', required: true },
        ],
        outputFields: [
          { name: 'message_id', label: '메시지 ID', type: 'number', required: true },
        ],
      },
    ],
  },

  // MySQL
  {
    id: 'mysql',
    type: 'mysql',
    name: 'MySQL',
    description: 'MySQL 데이터베이스 연동',
    icon: 'database',
    category: 'database',
    configSchema: [
      { name: 'host', label: '호스트', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '포트', type: 'number', required: true, placeholder: '3306' },
      { name: 'database', label: '데이터베이스', type: 'text', required: true },
      { name: 'user', label: '사용자', type: 'text', required: true },
      { name: 'password', label: '비밀번호', type: 'password', required: true },
    ],
    actions: [
      {
        id: 'query',
        name: '쿼리 실행',
        description: 'SQL 쿼리를 실행합니다',
        inputFields: [
          { name: 'sql', label: 'SQL', type: 'string', required: true },
          { name: 'params', label: '파라미터', type: 'array', required: false },
        ],
        outputFields: [
          { name: 'rows', label: '결과', type: 'array', required: true },
          { name: 'affectedRows', label: '영향 받은 행', type: 'number', required: false },
        ],
      },
    ],
  },

  // PostgreSQL
  {
    id: 'postgresql',
    type: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL 데이터베이스 연동',
    icon: 'database',
    category: 'database',
    configSchema: [
      { name: 'host', label: '호스트', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '포트', type: 'number', required: true, placeholder: '5432' },
      { name: 'database', label: '데이터베이스', type: 'text', required: true },
      { name: 'user', label: '사용자', type: 'text', required: true },
      { name: 'password', label: '비밀번호', type: 'password', required: true },
    ],
    actions: [
      {
        id: 'query',
        name: '쿼리 실행',
        description: 'SQL 쿼리를 실행합니다',
        inputFields: [
          { name: 'sql', label: 'SQL', type: 'string', required: true },
          { name: 'params', label: '파라미터', type: 'array', required: false },
        ],
        outputFields: [
          { name: 'rows', label: '결과', type: 'array', required: true },
          { name: 'rowCount', label: '행 수', type: 'number', required: false },
        ],
      },
    ],
  },

  // MongoDB
  {
    id: 'mongodb',
    type: 'mongodb',
    name: 'MongoDB',
    description: 'MongoDB 데이터베이스 연동',
    icon: 'database',
    category: 'database',
    configSchema: [
      {
        name: 'connectionString',
        label: '연결 문자열',
        type: 'password',
        required: true,
        placeholder: 'mongodb://localhost:27017',
      },
      { name: 'database', label: '데이터베이스', type: 'text', required: true },
    ],
    actions: [
      {
        id: 'find',
        name: '문서 조회',
        description: '컬렉션에서 문서를 조회합니다',
        inputFields: [
          { name: 'collection', label: '컬렉션', type: 'string', required: true },
          { name: 'filter', label: '필터', type: 'object', required: false },
          { name: 'limit', label: '제한', type: 'number', required: false },
        ],
        outputFields: [
          { name: 'documents', label: '문서 목록', type: 'array', required: true },
        ],
      },
      {
        id: 'insert',
        name: '문서 삽입',
        description: '컬렉션에 문서를 삽입합니다',
        inputFields: [
          { name: 'collection', label: '컬렉션', type: 'string', required: true },
          { name: 'document', label: '문서', type: 'object', required: true },
        ],
        outputFields: [
          { name: 'insertedId', label: '삽입된 ID', type: 'string', required: true },
        ],
      },
    ],
  },

  // Custom API
  {
    id: 'custom_api',
    type: 'custom_api',
    name: 'Custom API',
    description: '커스텀 REST API 호출',
    icon: 'api',
    category: 'api',
    configSchema: [
      { name: 'baseUrl', label: '기본 URL', type: 'text', required: true, placeholder: 'https://api.example.com' },
      { name: 'headers', label: '기본 헤더 (JSON)', type: 'text', required: false },
    ],
    actions: [
      {
        id: 'request',
        name: 'HTTP 요청',
        description: 'HTTP 요청을 보냅니다',
        inputFields: [
          {
            name: 'method',
            label: '메서드',
            type: 'string',
            required: true,
            description: 'GET, POST, PUT, PATCH, DELETE',
          },
          { name: 'path', label: '경로', type: 'string', required: true },
          { name: 'headers', label: '헤더', type: 'object', required: false },
          { name: 'body', label: '본문', type: 'object', required: false },
          { name: 'queryParams', label: '쿼리 파라미터', type: 'object', required: false },
        ],
        outputFields: [
          { name: 'status', label: '상태 코드', type: 'number', required: true },
          { name: 'headers', label: '응답 헤더', type: 'object', required: true },
          { name: 'data', label: '응답 데이터', type: 'object', required: true },
        ],
      },
    ],
  },
];

export function getConnectorDefinitions(): ConnectorDefinition[] {
  return connectorDefinitions;
}

export function getConnectorDefinition(type: string): ConnectorDefinition | undefined {
  return connectorDefinitions.find(d => d.type === type);
}

export default {
  getConnectorDefinitions,
  getConnectorDefinition,
};
