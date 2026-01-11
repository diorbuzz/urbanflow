import { useEffect, useRef, useState, useCallback } from 'react';

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectDelay?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, onConnect, onDisconnect, reconnectDelay = 3000 } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        setLastMessage(message);
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnect?.();

      // 자동 재연결
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, reconnectDelay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [onMessage, onConnect, onDisconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((executionId?: string, workflowId?: string) => {
    send({ type: 'subscribe', executionId, workflowId });
  }, [send]);

  const unsubscribe = useCallback((executionId?: string, workflowId?: string) => {
    send({ type: 'unsubscribe', executionId, workflowId });
  }, [send]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}
