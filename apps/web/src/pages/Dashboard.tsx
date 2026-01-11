import { useQuery } from '@tanstack/react-query';
import {
  Workflow,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/utils/api';

interface Stats {
  workflows: { total: number; active: number };
  executions: { running: number; completed: number; failed: number; successRate: number };
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/api/stats'),
  });

  const { data: executions } = useQuery<any[]>({
    queryKey: ['executions', 'recent'],
    queryFn: () => api.get<any[]>('/api/executions?limit=5'),
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
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Workflow}
          label="전체 워크플로우"
          value={stats?.workflows?.total || 0}
          subLabel={`${stats?.workflows?.active || 0}개 활성화`}
        />
        <StatCard
          icon={Play}
          label="실행 중"
          value={stats?.executions?.running || 0}
          color="text-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="성공"
          value={stats?.executions?.completed || 0}
          color="text-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="성공률"
          value={`${stats?.executions?.successRate || 0}%`}
          color="text-purple-500"
        />
      </div>

      {/* 최근 실행 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">최근 실행</h2>
          <Link
            to="/executions"
            className="text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        </div>

        {executions && executions.length > 0 ? (
          <div className="space-y-3">
            {executions.map((execution: any) => (
              <ExecutionItem key={execution.id} execution={execution} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            아직 실행 기록이 없습니다
          </div>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 시작</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/workflows"
            className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <Workflow className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-medium">새 워크플로우 만들기</h3>
            <p className="text-sm text-muted-foreground">
              자동화 워크플로우를 생성합니다
            </p>
          </Link>
          <Link
            to="/connectors"
            className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <Play className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="font-medium">커넥터 설정</h3>
            <p className="text-sm text-muted-foreground">
              외부 서비스와 연결합니다
            </p>
          </Link>
          <Link
            to="/settings"
            className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <Clock className="w-8 h-8 text-orange-500 mb-2" />
            <h3 className="font-medium">설정</h3>
            <p className="text-sm text-muted-foreground">
              시스템 설정을 관리합니다
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  color = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-accent ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subLabel && (
            <p className="text-xs text-muted-foreground">{subLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutionItem({ execution }: { execution: any }) {
  const statusIcon = {
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    running: <Clock className="w-4 h-4 text-blue-500 animate-spin" />,
    pending: <Clock className="w-4 h-4 text-gray-500" />,
    cancelled: <XCircle className="w-4 h-4 text-gray-500" />,
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {statusIcon[execution.status as keyof typeof statusIcon]}
        <div>
          <p className="text-sm font-medium">{execution.workflowId}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(execution.startedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}초` : '-'}
      </div>
    </div>
  );
}
