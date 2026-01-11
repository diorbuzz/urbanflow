import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { api } from '@/utils/api';
import type { Execution } from '@urbanflow/shared';

export default function ExecutionHistory() {
  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ['executions'],
    queryFn: () => api.get<Execution[]>('/api/executions'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">실행 이력</h1>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {executions && executions.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">워크플로우</th>
                <th className="px-4 py-3 text-left text-sm font-medium">트리거</th>
                <th className="px-4 py-3 text-left text-sm font-medium">시작 시간</th>
                <th className="px-4 py-3 text-left text-sm font-medium">소요 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {executions.map((execution) => (
                <tr key={execution.id} className="hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <StatusBadge status={execution.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-xs">{execution.workflowId}</span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {execution.triggerType}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(execution.startedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {execution.durationMs
                      ? `${(execution.durationMs / 1000).toFixed(2)}초`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">아직 실행 기록이 없습니다</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: {
      icon: CheckCircle,
      label: '완료',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    failed: {
      icon: XCircle,
      label: '실패',
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
    running: {
      icon: Clock,
      label: '실행 중',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    pending: {
      icon: Clock,
      label: '대기',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    cancelled: {
      icon: XCircle,
      label: '취소',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
