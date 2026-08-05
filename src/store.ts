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

  // Sessions (dynamic creation)
  createSession: (name?: string) => string; // returns the new session ID
  createWorkspaceGroup: (name: string) => string; // returns the new group ID
  deleteSession: (id: string) => void;

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

// ─── ID Generator ───
let sessionCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++sessionCounter}`;

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
        const filtered = removeNodeFromTree(node.children, id);
        return { ...node, children: filtered };
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

// Count all leaf nodes
const countLeafNodes = (nodes: TerminalNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      count++;
    } else {
      count += countLeafNodes(node.children);
    }
  }
  return count;
};

// Find the first workspace group (parent node), or null
const findFirstGroup = (nodes: TerminalNode[]): string | null => {
  for (const node of nodes) {
    if (node.children) return node.id;
  }
  return null;
};

// ─── Store ───
export const useStore = create<Store>((set, get) => ({
  // State — starts empty, everything is created dynamically
  nodes: [],
  tabs: [],
  activeTab: null,
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

  // ─── Dynamic Session Creation ───
  createSession: (name?: string) => {
    const state = get();
    const sessionId = generateId('session');
    const sessionNumber = countLeafNodes(state.nodes) + 1;
    const sessionName = name || `Session ${sessionNumber}`;

    // Find an existing workspace group to add to, or create a default one
    let groupId = findFirstGroup(state.nodes);

    if (!groupId) {
      // No groups exist — create a default workspace group first
      groupId = generateId('workspace');
      const group: TerminalNode = {
        id: groupId,
        name: 'Workspace',
        status: 'idle',
        isExpanded: true,
        children: [],
      };
      set(s => ({ nodes: [...s.nodes, group] }));
    }

    // Create the session node
    const sessionNode: TerminalNode = {
      id: sessionId,
      name: sessionName,
      status: 'idle',
      lastActivity: Date.now(),
    };

    // Add to tree, open tab, and set active
    set(s => ({
      nodes: addNodeToTree(s.nodes, groupId!, sessionNode),
      tabs: [
        ...s.tabs.map(t => ({ ...t, isActive: false })),
        { id: sessionId, label: sessionName, isActive: true },
      ],
      activeTab: sessionId,
    }));

    return sessionId;
  },

  createWorkspaceGroup: (name: string) => {
    const groupId = generateId('workspace');
    const group: TerminalNode = {
      id: groupId,
      name,
      status: 'idle',
      isExpanded: true,
      children: [],
    };
    set(s => ({ nodes: [...s.nodes, group] }));
    return groupId;
  },

  deleteSession: (id) => {
    const state = get();
    // Remove from tree, close tab, clean up active tab
    const newTabs = state.tabs.filter(t => t.id !== id);
    let newActiveTab = state.activeTab;

    if (state.activeTab === id) {
      const closedIndex = state.tabs.findIndex(t => t.id === id);
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
      newActiveTab = nextTab?.id || null;
    }

    set({
      nodes: removeNodeFromTree(state.nodes, id),
      tabs: newTabs.map(t => ({ ...t, isActive: t.id === newActiveTab })),
      activeTab: newActiveTab,
    });
  },

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
