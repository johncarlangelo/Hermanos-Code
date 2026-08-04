import { create } from 'zustand';
import { WorkspaceState, TerminalNode, NodeStatus, TabItem, LayoutMode, ConnectionStatus } from './types';

interface StoreActions {
  // Sidebar
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;

  // Tree
  toggleNodeExpansion: (id: string) => void;
  updateNodeStatus: (id: string, status: NodeStatus) => void;
  addNode: (parentId: string, node: TerminalNode) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;

  // Tabs
  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  reorderTabs: (fromId: string, toId: string) => void;

  // Layout
  toggleLayoutMode: () => void;
  setLayoutMode: (mode: LayoutMode) => void;

  // Command Palette
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Connection
  setConnectionStatus: (status: ConnectionStatus) => void;
}

type Store = WorkspaceState & StoreActions;

// ─── Initial Data ───
const initialNodes: TerminalNode[] = [
  {
    id: 'ws-primary',
    name: 'Primary Workspace',
    status: 'idle',
    isExpanded: true,
    children: [
      { id: 'agent-claude', name: 'Claude Code (Frontend)', status: 'active', description: 'React + Tailwind' },
      { id: 'agent-aider', name: 'Aider (Backend)', status: 'idle', description: 'Express + Socket.IO' },
    ]
  },
  {
    id: 'ws-utils',
    name: 'Utility Scripts',
    status: 'idle',
    isExpanded: true,
    children: [
      { id: 'agent-build', name: 'Build Watcher', status: 'idle', description: 'Vite HMR' }
    ]
  }
];

// ─── Helpers ───
const findNodeName = (nodes: TerminalNode[], id: string): string => {
  for (const node of nodes) {
    if (node.id === id) return node.name;
    if (node.children) {
      const found = findNodeName(node.children, id);
      if (found) return found;
    }
  }
  return id;
};

const updateNodeInTree = (
  nodes: TerminalNode[],
  id: string,
  updater: (node: TerminalNode) => TerminalNode
): TerminalNode[] => {
  return nodes.map(node => {
    if (node.id === id) return updater(node);
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
};

const removeNodeFromTree = (nodes: TerminalNode[], id: string): TerminalNode[] => {
  return nodes
    .filter(node => node.id !== id)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeNodeFromTree(node.children, id) };
      }
      return node;
    });
};

const addNodeToTree = (nodes: TerminalNode[], parentId: string, newNode: TerminalNode): TerminalNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
        isExpanded: true,
      };
    }
    if (node.children) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
    }
    return node;
  });
};

// ─── Store ───
export const useStore = create<Store>((set, get) => ({
  // State
  nodes: initialNodes,
  tabs: [
    { id: 'agent-claude', label: 'Claude Code (Frontend)', isActive: true },
    { id: 'agent-aider', label: 'Aider (Backend)', isActive: false },
  ],
  activeTab: 'agent-claude',
  layoutMode: 'tabs',
  isSidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  connectionStatus: 'connecting',

  // ─── Sidebar ───
  toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSidebarCollapse: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ─── Tree ───
  toggleNodeExpansion: (id) => set(s => ({
    nodes: updateNodeInTree(s.nodes, id, n => ({ ...n, isExpanded: !n.isExpanded }))
  })),

  updateNodeStatus: (id, status) => set(s => ({
    nodes: updateNodeInTree(s.nodes, id, n => ({ ...n, status }))
  })),

  addNode: (parentId, node) => set(s => ({
    nodes: addNodeToTree(s.nodes, parentId, node)
  })),

  removeNode: (id) => set(s => ({
    nodes: removeNodeFromTree(s.nodes, id),
    tabs: s.tabs.filter(t => t.id !== id),
    activeTab: s.activeTab === id
      ? (s.tabs.find(t => t.id !== id)?.id || null)
      : s.activeTab,
  })),

  renameNode: (id, name) => set(s => ({
    nodes: updateNodeInTree(s.nodes, id, n => ({ ...n, name })),
    tabs: s.tabs.map(t => t.id === id ? { ...t, label: name } : t),
  })),

  // ─── Tabs ───
  openTab: (id) => set(s => {
    const exists = s.tabs.find(t => t.id === id);
    if (exists) {
      return {
        tabs: s.tabs.map(t => ({ ...t, isActive: t.id === id })),
        activeTab: id,
      };
    }
    const label = findNodeName(s.nodes, id);
    return {
      tabs: [
        ...s.tabs.map(t => ({ ...t, isActive: false })),
        { id, label, isActive: true }
      ],
      activeTab: id,
    };
  }),

  closeTab: (id) => set(s => {
    const newTabs = s.tabs.filter(t => t.id !== id);
    let newActiveTab = s.activeTab;

    if (s.activeTab === id) {
      const closedIndex = s.tabs.findIndex(t => t.id === id);
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
      newActiveTab = nextTab?.id || null;
    }

    return {
      tabs: newTabs.map(t => ({ ...t, isActive: t.id === newActiveTab })),
      activeTab: newActiveTab,
    };
  }),

  setActiveTab: (id) => set(s => ({
    tabs: s.tabs.map(t => ({ ...t, isActive: t.id === id })),
    activeTab: id,
  })),

  reorderTabs: (fromId, toId) => set(s => {
    const fromIdx = s.tabs.findIndex(t => t.id === fromId);
    const toIdx = s.tabs.findIndex(t => t.id === toId);
    if (fromIdx === -1 || toIdx === -1) return s;
    const newTabs = [...s.tabs];
    const [moved] = newTabs.splice(fromIdx, 1);
    newTabs.splice(toIdx, 0, moved);
    return { tabs: newTabs };
  }),

  // ─── Layout ───
  toggleLayoutMode: () => set(s => ({
    layoutMode: s.layoutMode === 'tabs' ? 'split' : 'tabs'
  })),

  setLayoutMode: (mode) => set({ layoutMode: mode }),

  // ─── Command Palette ───
  toggleCommandPalette: () => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // ─── Connection ───
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
