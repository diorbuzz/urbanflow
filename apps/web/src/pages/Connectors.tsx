import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  MessageSquare,
  Database,
  Globe,
  Trash2,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/utils/api';
import type { Connector, ConnectorDefinition } from '@urbanflow/shared';

export default function Connectors() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: connectors, isLoading } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => api.get<Connector[]>('/api/connectors'),
  });

  const { data: connectorTypes } = useQuery({
    queryKey: ['connector-types'],
    queryFn: () => api.get<ConnectorDefinition[]>('/api/connectors/types'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/connectors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
    },
  });

  const categoryIcons = {
    messenger: MessageSquare,
    database: Database,
    api: Globe,
  };

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
        <h1 className="text-2xl font-bold">커넥터</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          커넥터 추가
        </button>
      </div>

      {/* 등록된 커넥터 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">등록된 커넥터</h2>

        {connectors && connectors.length > 0 ? (
          <div className="grid gap-4">
            {connectors.map((connector) => {
              const Icon = categoryIcons[connector.type as keyof typeof categoryIcons] || Globe;
              return (
                <div
                  key={connector.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{connector.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {connector.type} · 사용 {connector.usageCount}회
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connector.isActive && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        활성
                      </span>
                    )}
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('정말 삭제하시겠습니까?')) {
                          deleteMutation.mutate(connector.id);
                        }
                      }}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            등록된 커넥터가 없습니다
          </p>
        )}
      </div>

      {/* 사용 가능한 커넥터 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">사용 가능한 커넥터</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectorTypes?.map((type) => {
            const Icon = categoryIcons[type.category as keyof typeof categoryIcons] || Globe;
            return (
              <div
                key={type.id}
                className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                onClick={() => setShowAdd(true)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent rounded-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium">{type.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추가 모달 (간단 버전) */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">커넥터 추가</h2>
            <p className="text-muted-foreground mb-4">
              커넥터 추가 기능은 개발 중입니다.
            </p>
            <button
              onClick={() => setShowAdd(false)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
