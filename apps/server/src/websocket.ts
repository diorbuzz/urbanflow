import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { workflowExecutor } from './engine/index.js';
import { logger } from './utils/logger.js';

interface WSClient {
  ws: WebSocket;
  subscriptions: Set<string>;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private clientIdCounter = 0;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      const clientId = `client_${++this.clientIdCounter}`;
      this.clients.set(clientId, { ws, subscriptions: new Set() });

      logger.info({ clientId }, 'WebSocket client connected');

      // 클라이언트에게 연결 확인 메시지 전송
      this.send(ws, {
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      });

      // 메시지 수신 처리
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error({ error }, 'Failed to parse WebSocket message');
        }
      });

      // 연결 종료 처리
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info({ clientId }, 'WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error({ clientId, error: error.message }, 'WebSocket error');
      });
    });

    // WorkflowExecutor 이벤트 구독
    this.setupExecutorEvents();

    logger.info('WebSocket server initialized');
  }

  private setupExecutorEvents(): void {
    // 실행 시작 이벤트
    workflowExecutor.on('execution:started', (data) => {
      this.broadcast({
        type: 'execution:started',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 실행 완료 이벤트
    workflowExecutor.on('execution:completed', (data) => {
      this.broadcast({
        type: 'execution:completed',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 실행 실패 이벤트
    workflowExecutor.on('execution:failed', (data) => {
      this.broadcast({
        type: 'execution:failed',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 실행 취소 이벤트
    workflowExecutor.on('execution:cancelled', (data) => {
      this.broadcast({
        type: 'execution:cancelled',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 노드 시작 이벤트
    workflowExecutor.on('node:started', (data) => {
      this.broadcast({
        type: 'node:started',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 노드 완료 이벤트
    workflowExecutor.on('node:completed', (data) => {
      this.broadcast({
        type: 'node:completed',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 노드 실패 이벤트
    workflowExecutor.on('node:failed', (data) => {
      this.broadcast({
        type: 'node:failed',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private handleMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        // 특정 워크플로우/실행 구독
        if (message.executionId) {
          client.subscriptions.add(`execution:${message.executionId}`);
        }
        if (message.workflowId) {
          client.subscriptions.add(`workflow:${message.workflowId}`);
        }
        this.send(client.ws, {
          type: 'subscribed',
          subscriptions: Array.from(client.subscriptions),
        });
        break;

      case 'unsubscribe':
        // 구독 해제
        if (message.executionId) {
          client.subscriptions.delete(`execution:${message.executionId}`);
        }
        if (message.workflowId) {
          client.subscriptions.delete(`workflow:${message.workflowId}`);
        }
        this.send(client.ws, {
          type: 'unsubscribed',
          subscriptions: Array.from(client.subscriptions),
        });
        break;

      case 'ping':
        this.send(client.ws, { type: 'pong' });
        break;
    }
  }

  private send(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private broadcast(data: any): void {
    const message = JSON.stringify(data);

    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      // 구독 필터링 (비어있으면 모든 메시지 수신)
      if (client.subscriptions.size === 0) {
        client.ws.send(message);
        continue;
      }

      // 구독된 실행/워크플로우만 전송
      const isSubscribed =
        (data.executionId && client.subscriptions.has(`execution:${data.executionId}`)) ||
        (data.workflowId && client.subscriptions.has(`workflow:${data.workflowId}`));

      if (isSubscribed) {
        client.ws.send(message);
      }
    }
  }

  // 특정 클라이언트에게 메시지 전송
  sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.send(client.ws, data);
    }
  }

  // 연결된 클라이언트 수 반환
  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
