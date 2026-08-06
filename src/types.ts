// ─── Node Status ───
export type NodeStatus = 'idle' | 'active' | 'running' | 'error' | 'disconnected';

// ─── Terminal Tree Node ───
export interface TerminalNode {
  id: string;
  name: string;
  status: NodeStatus;
  children?: TerminalNode[];
  isExpanded?: boolean;
  description?: string;
  lastActivity?: number; // timestamp
  repoPath?: string;     // path to git repository or working directory
  branch?: string;       // git branch (e.g. 'main', 'feature/auth')
  isRepoGroup?: boolean; // flags node as a repo workspace group
  cwd?: string;          // working directory for terminal sessions
}

// ─── Tab Item ───
export interface TabItem {
  id: string;       // matches TerminalNode.id
  label: string;    // display name
  isActive: boolean;
}

// ─── Layout Mode ───
export type LayoutMode = 'tabs' | 'split';

// ─── Connection Status ───
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// ─── Workspace State ───
export interface WorkspaceState {
  nodes: TerminalNode[];
  tabs: TabItem[];
  activeTab: string | null;
  layoutMode: LayoutMode;
  isSidebarOpen: boolean;
  sidebarCollapsed: boolean;  // true = icon-only rail
  commandPaletteOpen: boolean;
  connectionStatus: ConnectionStatus;
}
