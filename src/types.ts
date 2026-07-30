export type NodeStatus = 'idle' | 'active';

export interface TerminalNode {
  id: string;
  name: string;
  status: NodeStatus;
  children?: TerminalNode[];
  isExpanded?: boolean;
}

export interface WorkspaceState {
  nodes: TerminalNode[];
  activePanes: string[]; // IDs of terminal nodes that are currently open in the grid
  isSidebarOpen: boolean;
}
