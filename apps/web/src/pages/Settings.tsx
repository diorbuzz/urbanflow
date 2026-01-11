import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string>>('/api/settings'),
  });

  const [formData, setFormData] = useState({
    'execution.max_concurrent': '5',
    'execution.timeout_ms': '300000',
    'execution.retry_count': '3',
    'log.retention_days': '30',
  });

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.put('/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('설정이 저장되었습니다');
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">설정</h1>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>

      {/* 실행 설정 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">실행 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              최대 동시 실행 수
            </label>
            <input
              type="number"
              value={formData['execution.max_concurrent']}
              onChange={(e) =>
                handleChange('execution.max_concurrent', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              동시에 실행할 수 있는 워크플로우 수
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              실행 제한 시간 (ms)
            </label>
            <input
              type="number"
              value={formData['execution.timeout_ms']}
              onChange={(e) =>
                handleChange('execution.timeout_ms', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              워크플로우 실행 최대 시간 (기본: 300000ms = 5분)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              재시도 횟수
            </label>
            <input
              type="number"
              value={formData['execution.retry_count']}
              onChange={(e) =>
                handleChange('execution.retry_count', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              노드 실행 실패 시 재시도 횟수
            </p>
          </div>
        </div>
      </div>

      {/* 로그 설정 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">로그 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              로그 보관 기간 (일)
            </label>
            <input
              type="number"
              value={formData['log.retention_days']}
              onChange={(e) =>
                handleChange('log.retention_days', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              실행 로그를 보관하는 기간
            </p>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">시스템 정보</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">버전</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">데이터베이스</span>
            <span>SQLite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">API 서버</span>
            <span>http://localhost:3001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
