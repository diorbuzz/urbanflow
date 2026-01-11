import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, ArrowLeft, Activity, X } from 'lucide-react';
import { api } from '@/utils/api';
import { useWorkflowStore } from '@/stores/workflowStore';
import NodePalette from '@/components/workflow/NodePalette';
import NodeConfig from '@/components/workflow/NodeConfig';
import { ExecutionMonitor } from '@/components/workflow/ExecutionMonitor';
import TriggerNode from '@/components/nodes/TriggerNode';
import ActionNode from '@/components/nodes/ActionNode';
import ConditionNode from '@/components/nodes/ConditionNode';
import type { Workflow } from '@urbanflow/shared';

type WorkflowNode = Node<{ label: string; config: Record<string, any> }>;
type WorkflowEdge = Edge;

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  connector: ActionNode, // 재사용
};

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMonitor, setShowMonitor] = useState(false);

  const { selectedNodeId, selectNode, isDirty, setDirty } = useWorkflowStore();

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api.get<Workflow>(`/api/workflows/${id}`),
    enabled: !!id,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);

  // 워크플로우 로드
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.definition.nodes || []);
      setEdges(workflow.definition.edges || []);
      setDirty(false);
    }
  }, [workflow, setNodes, setEdges, setDirty]);

  // 저장 뮤테이션
  const saveMutation = useMutation({
    mutationFn: (data: { definition: any }) =>
      api.put(`/api/workflows/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      setDirty(false);
    },
  });

  // 실행 뮤테이션
  const executeMutation = useMutation({
    mutationFn: () => api.post(`/api/workflows/${id}/execute`),
    onSuccess: () => {
      setShowMonitor(true);
    },
  });

  // 엣지 연결
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setDirty(true);
    },
    [setEdges, setDirty]
  );

  // 노드 변경 감지
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      if (changes.some((c: any) => c.type !== 'select')) {
        setDirty(true);
      }
    },
    [onNodesChange, setDirty]
  );

  // 노드 선택
  const onNodeClick = useCallback(
    (_: any, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // 빈 공간 클릭
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // 노드 드롭
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 300,
        y: event.clientY - 100,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type === 'trigger' ? '트리거' : type === 'condition' ? '조건' : '액션',
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setDirty(true);
    },
    [setNodes, setDirty]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    saveMutation.mutate({
      definition: {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    });
  }, [nodes, edges, saveMutation]);

  // 선택된 노드
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {/* 노드 팔레트 */}
      <NodePalette />

      {/* 캔버스 */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} />

          {/* 상단 패널 */}
          <Panel position="top-left" className="flex items-center gap-2">
            <button
              onClick={() => navigate('/workflows')}
              className="p-2 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-card rounded-lg border border-border px-4 py-2">
              <h2 className="font-medium">{workflow?.name}</h2>
            </div>
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            <button
              onClick={() => setShowMonitor(!showMonitor)}
              className={`flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border hover:bg-accent transition-colors ${showMonitor ? 'bg-accent' : ''}`}
            >
              <Activity className="w-4 h-4" />
              모니터
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              저장
              {isDirty && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
            </button>
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              실행
            </button>
          </Panel>

          {/* 실행 모니터 패널 */}
          {showMonitor && id && (
            <Panel position="bottom-right" className="w-80">
              <div className="relative">
                <button
                  onClick={() => setShowMonitor(false)}
                  className="absolute -top-2 -right-2 p-1 bg-card rounded-full border border-border hover:bg-accent z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                <ExecutionMonitor workflowId={id} />
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* 설정 패널 */}
      {selectedNode && (
        <NodeConfig
          node={selectedNode}
          onUpdate={(data) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === selectedNode.id ? { ...n, data: { ...n.data, ...data } } : n
              )
            );
            setDirty(true);
          }}
          onClose={() => selectNode(null)}
        />
      )}
    </div>
  );
}
