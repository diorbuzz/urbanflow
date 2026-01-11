import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface NodeStatus {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: unknown;
  error?: string;
  timestamp: string;
}

interface ExecutionState {
  executionId: string | null;
  workflowId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  nodeStatuses: Map<string, NodeStatus>;
  logs: Array<{ type: string; message: string; timestamp: string }>;
}

interface ExecutionMonitorProps {
  workflowId: string;
  onNodeStatusChange?: (nodeId: string, status: NodeStatus) => void;
}

export function ExecutionMonitor({ workflowId, onNodeStatusChange }: ExecutionMonitorProps) {
  const [execution, setExecution] = useState<ExecutionState>({
    executionId: null,
    workflowId: null,
    status: 'idle',
    nodeStatuses: new Map(),
    logs: [],
  });

  const { isConnected, subscribe } = useWebSocket({
    onMessage: (message) => {
      // 현재 워크플로우의 메시지만 처리
      if (message.workflowId !== workflowId) return;

      setExecution((prev) => {
        const newLogs = [...prev.logs, {
          type: message.type,
          message: getLogMessage(message),
          timestamp: message.timestamp as string,
        }];

        switch (message.type) {
          case 'execution:started':
            return {
              ...prev,
              executionId: message.executionId as string,
              workflowId: message.workflowId as string,
              status: 'running',
              nodeStatuses: new Map(),
              logs: newLogs,
            };

          case 'execution:completed':
            return { ...prev, status: 'completed', logs: newLogs };

          case 'execution:failed':
            return { ...prev, status: 'failed', logs: newLogs };

          case 'execution:cancelled':
            return { ...prev, status: 'cancelled', logs: newLogs };

          case 'node:started': {
            const nodeStatus: NodeStatus = {
              nodeId: message.nodeId as string,
              nodeType: message.nodeType as string,
              status: 'running',
              timestamp: message.timestamp as string,
            };
            prev.nodeStatuses.set(message.nodeId as string, nodeStatus);
            onNodeStatusChange?.(message.nodeId as string, nodeStatus);
            return { ...prev, nodeStatuses: new Map(prev.nodeStatuses), logs: newLogs };
          }

          case 'node:completed': {
            const existing = prev.nodeStatuses.get(message.nodeId as string);
            const nodeStatus: NodeStatus = {
              ...(existing || { nodeId: message.nodeId as string, nodeType: 'unknown' }),
              status: 'completed',
              output: message.output,
              timestamp: message.timestamp as string,
            };
            prev.nodeStatuses.set(message.nodeId as string, nodeStatus);
            onNodeStatusChange?.(message.nodeId as string, nodeStatus);
            return { ...prev, nodeStatuses: new Map(prev.nodeStatuses), logs: newLogs };
          }

          case 'node:failed': {
            const existing = prev.nodeStatuses.get(message.nodeId as string);
            const nodeStatus: NodeStatus = {
              ...(existing || { nodeId: message.nodeId as string, nodeType: 'unknown' }),
              status: 'failed',
              error: message.error as string,
              timestamp: message.timestamp as string,
            };
            prev.nodeStatuses.set(message.nodeId as string, nodeStatus);
            onNodeStatusChange?.(message.nodeId as string, nodeStatus);
            return { ...prev, nodeStatuses: new Map(prev.nodeStatuses), logs: newLogs };
          }

          default:
            return prev;
        }
      });
    },
  });

  useEffect(() => {
    if (isConnected) {
      subscribe(undefined, workflowId);
    }
  }, [isConnected, workflowId, subscribe]);

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">실행 모니터</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
      </div>

      {execution.status !== 'idle' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">상태:</span>
            <StatusBadge status={execution.status} />
          </div>
          {execution.executionId && (
            <div className="text-xs text-muted-foreground">
              실행 ID: {execution.executionId}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {execution.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">실행 대기 중...</p>
        ) : (
          execution.logs.slice(-10).map((log, index) => (
            <div
              key={index}
              className="text-xs flex items-start gap-2 py-1 border-b border-border/50 last:border-0"
            >
              <span className="text-muted-foreground whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ExecutionState['status'] }) {
  const styles = {
    idle: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800 animate-pulse',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    idle: '대기',
    running: '실행 중',
    completed: '완료',
    failed: '실패',
    cancelled: '취소됨',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function getLogMessage(message: Record<string, unknown>): string {
  switch (message.type) {
    case 'execution:started':
      return '워크플로우 실행 시작';
    case 'execution:completed':
      return '워크플로우 실행 완료';
    case 'execution:failed':
      return `워크플로우 실행 실패: ${message.error || '알 수 없는 오류'}`;
    case 'execution:cancelled':
      return '워크플로우 실행 취소됨';
    case 'node:started':
      return `노드 시작: ${message.nodeId} (${message.nodeType})`;
    case 'node:completed':
      return `노드 완료: ${message.nodeId}`;
    case 'node:failed':
      return `노드 실패: ${message.nodeId} - ${message.error}`;
    default:
      return message.type as string;
  }
}

function getLogColor(type: string): string {
  if (type.includes('failed')) return 'text-red-600';
  if (type.includes('completed')) return 'text-green-600';
  if (type.includes('started')) return 'text-blue-600';
  if (type.includes('cancelled')) return 'text-yellow-600';
  return 'text-foreground';
}
