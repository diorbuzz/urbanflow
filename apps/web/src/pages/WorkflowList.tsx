import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Search,
} from 'lucide-react';
import { api } from '@/utils/api';
import type { Workflow } from '@urbanflow/shared';

export default function WorkflowList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get<Workflow[]>('/api/workflows'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Workflow>('/api/workflows', {
        name: '새 워크플로우',
        description: '',
      }),
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(`/workflows/${workflow.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (workflow: Workflow) =>
      api.post(
        `/api/workflows/${workflow.id}/${
          workflow.status === 'active' ? 'deactivate' : 'activate'
        }`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const filteredWorkflows = workflows?.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold">워크플로우</h1>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          새 워크플로우
        </button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="워크플로우 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 워크플로우 목록 */}
      {filteredWorkflows && filteredWorkflows.length > 0 ? (
        <div className="grid gap-4">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={() => navigate(`/workflows/${workflow.id}`)}
              onToggle={() => toggleMutation.mutate(workflow)}
              onDuplicate={() => duplicateMutation.mutate(workflow.id)}
              onDelete={() => {
                if (confirm('정말 삭제하시겠습니까?')) {
                  deleteMutation.mutate(workflow.id);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">
            {search ? '검색 결과가 없습니다' : '아직 워크플로우가 없습니다'}
          </p>
          {!search && (
            <button
              onClick={() => createMutation.mutate()}
              className="text-primary hover:underline"
            >
              첫 워크플로우 만들기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowCard({
  workflow,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  workflow: Workflow;
  onEdit: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div
          className="flex-1 cursor-pointer"
          onClick={onEdit}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <h3 className="font-medium">{workflow.name}</h3>
          </div>
          {workflow.description && (
            <p className="text-sm text-muted-foreground mt-1 ml-6">
              {workflow.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
            <span>
              트리거: {workflow.triggerType || '없음'}
            </span>
            <span>
              실행: {workflow.executionCount}회
            </span>
            <span>
              수정: {new Date(workflow.updatedAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    onEdit();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  편집
                </button>
                <button
                  onClick={() => {
                    onToggle();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  {workflow.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4" /> 비활성화
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> 활성화
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> 복제
                </button>
                <hr className="border-border" />
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
