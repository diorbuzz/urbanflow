import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;

  // 노드 관리
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;

  // 엣지 관리
  setEdges: (edges: Edge[]) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;

  // 선택
  selectNode: (id: string | null) => void;

  // 상태
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isDirty: true,
    })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...data } : node
      ),
      isDirty: true,
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    })),

  setEdges: (edges) => set({ edges, isDirty: true }),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
      isDirty: true,
    })),

  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      isDirty: true,
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  setDirty: (isDirty) => set({ isDirty }),

  reset: () => set(initialState),
}));
