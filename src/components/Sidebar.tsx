import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { TerminalNode } from '../types';
import {
  ChevronRight,
  ChevronDown,
  Terminal,
  Folder,
  FolderOpen,
  Plus,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

// ─── Status dot config ───
const statusColors: Record<string, string> = {
  active: 'bg-[var(--color-accent)] animate-pulse-glow',
  running: 'bg-[var(--color-accent)] animate-pulse-glow',
  error: 'bg-[var(--color-accent-red)] animate-pulse-fast',
  disconnected: 'bg-[var(--color-text-dim)]',
  idle: 'bg-[var(--color-text-dim)]',
};

// ─── Tree Node ───
const TreeNode: React.FC<{ node: TerminalNode; level?: number }> = ({ node, level = 0 }) => {
  const toggleNodeExpansion = useStore(s => s.toggleNodeExpansion);
  const openTab = useStore(s => s.openTab);
  const activeTab = useStore(s => s.activeTab);

  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const isOpen = node.id === activeTab;
  const isActive = node.status === 'active' || node.status === 'running';
  const dotClass = statusColors[node.status] || statusColors.idle;

  return (
    <div className="relative">
      <motion.button
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer rounded-md mx-1 transition-colors duration-150 group relative overflow-hidden
          ${isOpen && isLeaf
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/4'
          }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => {
          if (hasChildren) {
            toggleNodeExpansion(node.id);
          } else {
            openTab(node.id);
          }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* In-progress sweep gradient background */}
        {isActive && isLeaf && (
          <div
            className="absolute inset-0 rounded-md animate-progress-sweep pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.08) 30%, rgba(6,182,212,0.15) 50%, rgba(6,182,212,0.08) 70%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        )}

        {/* Static active background (non-animated fallback) */}
        {isOpen && isLeaf && !isActive && (
          <div className="absolute inset-0 rounded-md bg-[var(--color-accent)]/8 pointer-events-none" />
        )}

        {/* Expand / Status icon */}
        {hasChildren ? (
          <span className="w-4 h-4 flex items-center justify-center text-[var(--color-text-dim)] shrink-0 relative z-10">
            {node.isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 flex items-center justify-center shrink-0 relative z-10">
            <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          </span>
        )}

        {/* Folder / Terminal icon */}
        <span className="relative z-10">
          {hasChildren ? (
            <span className="text-[var(--color-text-dim)] shrink-0">
              {node.isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <Terminal className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-dim)]" />
          )}
        </span>

        {/* Label */}
        <span className={`text-[12px] truncate flex-1 relative z-10 ${level === 0 ? 'font-semibold uppercase tracking-wider text-[11px]' : 'font-medium'} ${isActive && isLeaf ? 'text-[var(--color-accent)]' : ''}`}>
          {node.name}
        </span>

        {/* "Working" badge for active agents */}
        {isActive && isLeaf && (
          <span className="relative z-10 text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded border border-[var(--color-accent)]/20 shrink-0">
            working
          </span>
        )}

        {/* Active indicator bar */}
        {isOpen && isLeaf && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[var(--color-accent)] rounded-full z-10"
            layoutId="sidebar-active"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ boxShadow: '0 0 6px var(--color-glow)' }}
          />
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && node.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="ml-4 border-l border-[var(--color-border)] pl-0">
              {node.children!.map(child => (
                <TreeNode key={child.id} node={child} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Sidebar ───
export const Sidebar: React.FC = () => {
  const nodes = useStore(s => s.nodes);
  const tabs = useStore(s => s.tabs);
  const isSidebarOpen = useStore(s => s.isSidebarOpen);
  const sidebarCollapsed = useStore(s => s.sidebarCollapsed);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleSidebarCollapse = useStore(s => s.toggleSidebarCollapse);

  if (!isSidebarOpen) return null;

  const isCollapsed = sidebarCollapsed;

  return (
    <motion.aside
      className="h-full flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] select-none overflow-hidden shrink-0 relative"
      initial={false}
      animate={{ width: isCollapsed ? 48 : 260 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* ─── Header ─── */}
      <div className="px-3 py-3 shrink-0 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            {/* Logo */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-cyan-700 flex items-center justify-center shrink-0 glow-accent-sm">
              <Terminal className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 min-w-0"
              >
                <h1 className="text-[13px] font-bold tracking-tight text-[var(--color-text-primary)] whitespace-nowrap">
                  Hermanos<span className="text-[var(--color-text-muted)] font-normal"> Code</span>
                </h1>
              </motion.div>
            )}
          </div>

          {/* Collapse / Expand button — always visible */}
          {!isCollapsed && (
            <button
              className="p-1.5 rounded-md text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] hover:bg-white/5 transition-colors cursor-pointer"
              onClick={toggleSidebarCollapse}
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expand button when collapsed — positioned below the logo */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-2 gap-1">
          <button
            className="p-1.5 rounded-md text-[var(--color-text-dim)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors cursor-pointer"
            onClick={toggleSidebarCollapse}
            title="Expand Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Tree ─── */}
      {!isCollapsed && (
        <motion.div
          className="flex-1 overflow-y-auto py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">
              Sessions
            </span>
          </div>
          {nodes.map(node => (
            <TreeNode key={node.id} node={node} />
          ))}
        </motion.div>
      )}

      {/* ─── Bottom Actions ─── */}
      {!isCollapsed && (
        <div className="mt-auto p-3 shrink-0 space-y-3 border-t border-[var(--color-border)]">
          {/* Add Session */}
          <motion.button
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 rounded-lg py-2 text-[12px] font-medium transition-all cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Add Session
          </motion.button>

          {/* Status Widget */}
          <div className="bg-[var(--color-void)] rounded-lg p-2.5 border border-[var(--color-border)]">
            <div className="flex justify-between items-center text-[10px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
              <span>Active</span>
              <span className="text-[var(--color-accent)] font-mono">{String(tabs.length).padStart(2, '0')}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(10, (tabs.length / 5) * 100))}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 8px var(--color-glow)' }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};
