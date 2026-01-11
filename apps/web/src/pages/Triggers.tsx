import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Clock, Webhook, Trash2, Play, Pause, Copy, Check } from 'lucide-react';

interface Schedule {
  id: string;
  workflow_id: string;
  workflow_name: string;
  cron_expression: string;
  timezone: string;
  is_active: number;
  run_count: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

interface WebhookData {
  id: string;
  workflow_id: string;
  workflow_name: string;
  path: string;
  method: string;
  is_active: number;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

export default function Triggers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schedules' | 'webhooks'>('schedules');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.get<Schedule[]>('/triggers/schedules'),
  });

  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get<WebhookData[]>('/triggers/webhooks'),
  });

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => api.delete(`/triggers/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const toggleSchedule = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/triggers/schedules/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const deleteWebhook = useMutation({
    mutationFn: (id: string) => api.delete(`/triggers/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const toggleWebhook = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/triggers/webhooks/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const copyWebhookUrl = (path: string, id: string) => {
    const url = `${window.location.origin.replace(/:\d+$/, ':3001')}/webhook/${path}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">트리거 관리</h1>
        <p className="text-muted-foreground">스케줄과 웹훅을 관리합니다</p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'schedules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          스케줄 ({schedules.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'webhooks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Webhook className="w-4 h-4" />
          웹훅 ({webhooks.length})
        </button>
      </div>

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {schedulesLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 스케줄이 없습니다
            </div>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-card border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{schedule.workflow_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          schedule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {schedule.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <code className="bg-muted px-1 rounded">{schedule.cron_expression}</code>
                      <span className="mx-2">|</span>
                      {schedule.timezone}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      실행 횟수: {schedule.run_count}
                      {schedule.last_run_at && (
                        <>
                          <span className="mx-2">|</span>
                          마지막 실행: {new Date(schedule.last_run_at).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggleSchedule.mutate({
                          id: schedule.id,
                          isActive: !schedule.is_active,
                        })
                      }
                      className="p-2 rounded hover:bg-muted"
                      title={schedule.is_active ? '비활성화' : '활성화'}
                    >
                      {schedule.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                          deleteSchedule.mutate(schedule.id);
                        }
                      }}
                      className="p-2 rounded hover:bg-muted text-red-500"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          {webhooksLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 웹훅이 없습니다
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="bg-card border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{webhook.workflow_name}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        {webhook.method}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          webhook.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {webhook.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">
                        /webhook/{webhook.path}
                      </code>
                      <button
                        onClick={() => copyWebhookUrl(webhook.path, webhook.id)}
                        className="p-1 rounded hover:bg-muted"
                        title="URL 복사"
                      >
                        {copiedId === webhook.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      호출 횟수: {webhook.trigger_count}
                      {webhook.last_triggered_at && (
                        <>
                          <span className="mx-2">|</span>
                          마지막 호출: {new Date(webhook.last_triggered_at).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggleWebhook.mutate({
                          id: webhook.id,
                          isActive: !webhook.is_active,
                        })
                      }
                      className="p-2 rounded hover:bg-muted"
                      title={webhook.is_active ? '비활성화' : '활성화'}
                    >
                      {webhook.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 웹훅을 삭제하시겠습니까?')) {
                          deleteWebhook.mutate(webhook.id);
                        }
                      }}
                      className="p-2 rounded hover:bg-muted text-red-500"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
