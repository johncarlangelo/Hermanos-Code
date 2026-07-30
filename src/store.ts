import { create } from 'zustand';
import { WorkspaceState, TerminalNode, NodeStatus } from './types';

interface StoreState extends WorkspaceState {
  toggleNodeExpansion: (id: string) => void;
  openPane: (id: string) => void;
  closePane: (id: string) => void;
  reorderPanes: (fromId: string, toId: string) => void;
  updateNodeStatus: (id: string, status: NodeStatus) => void;
  toggleSidebar: () => void;
}

const initialNodes: TerminalNode[] = [
  {
    id: 'ws-primary',
    name: 'Primary Workspace',
    status: 'idle',
    isExpanded: true,
    children: [
      { id: 'agent-claude', name: 'Claude Code (Frontend)', status: 'active' },
      { id: 'agent-aider', name: 'Aider (Backend)', status: 'idle' },
    ]
  },
  {
    id: 'ws-utils',
    name: 'Utility Scripts',
    status: 'idle',
    isExpanded: true,
    children: [
      { id: 'agent-build', name: 'Build Watcher', status: 'idle' }
    ]
  }
];

// Helper to recursively update a node in the tree
const updateNodeInTree = (nodes: TerminalNode[], id: string, updater: (node: TerminalNode) => TerminalNode): TerminalNode[] => {
  return nodes.map(node => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updater)
      };
    }
    return node;
  });
};

export const useStore = create<StoreState>((set) => ({
  nodes: initialNodes,
  activePanes: ['agent-claude', 'agent-aider'],
  isSidebarOpen: true,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleNodeExpansion: (id) => set((state) => ({
    nodes: updateNodeInTree(state.nodes, id, (node) => ({ ...node, isExpanded: !node.isExpanded }))
  })),

  openPane: (id) => set((state) => {
    if (state.activePanes.includes(id)) return state;
    return { activePanes: [...state.activePanes, id] };
  }),

  closePane: (id) => set((state) => ({
    activePanes: state.activePanes.filter(paneId => paneId !== id)
  })),

  reorderPanes: (fromId, toId) => set((state) => {
    const fromIndex = state.activePanes.indexOf(fromId);
    const toIndex = state.activePanes.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return state;
    
    const newPanes = [...state.activePanes];
    newPanes.splice(fromIndex, 1);
    newPanes.splice(toIndex, 0, fromId);
    
    return { activePanes: newPanes };
  }),

  updateNodeStatus: (id, status) => set((state) => ({
    nodes: updateNodeInTree(state.nodes, id, (node) => ({ ...node, status }))
  })),
}));
