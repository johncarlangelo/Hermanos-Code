import React from 'react';
import { useStore } from '../store';
import { TerminalNode } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TreeNode: React.FC<{ node: TerminalNode; level?: number; isLast?: boolean }> = ({ node, level = 0, isLast = false }) => {
  const toggleNodeExpansion = useStore((state) => state.toggleNodeExpansion);
  const openPane = useStore((state) => state.openPane);
  const activePanes = useStore((state) => state.activePanes);

  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const isOpen = activePanes.includes(node.id);
  const isActive = node.status === 'active';

  return (
    <div className={cn("relative space-y-0.5", level === 0 && "mt-3")}>
      <div
        data-tree-node
        tabIndex={0}
        className={cn(
          "flex items-center gap-2 group cursor-pointer focus:outline-none transition-all duration-200 rounded-md mx-2",
          level > 0 ? "h-8 pl-4" : "h-7",
          isOpen && isLeaf ? "bg-white/5 shadow-inner" : "hover:bg-white/5"
        )}
        style={level > 0 ? { marginLeft: `${level * 16}px` } : {}}
        onClick={() => {
          if (hasChildren) {
            toggleNodeExpansion(node.id);
          } else {
            openPane(node.id);
          }
        }}
      >
        {/* Active Focus Indicator */}
        {isOpen && isLeaf && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-[var(--color-accent)] rounded-full shadow-[0_0_8px_var(--color-accent)]"></div>
        )}

        <div className="flex items-center gap-3 w-full px-2">
          {hasChildren ? (
            <div className="w-3 h-3 flex items-center justify-center text-[var(--color-text-dim)] font-mono text-xs transition-transform duration-200">
              {node.isExpanded ? '-' : '+'}
            </div>
          ) : (
            <div className="w-3 h-3 flex items-center justify-center">
              {isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)] animate-pulse-glow"></div>
              ) : (
                <div className="w-1 h-1 rounded-full bg-[var(--color-border)] group-hover:bg-[var(--color-text-dim)] transition-colors"></div>
              )}
            </div>
          )}

          <span className={cn(
            "text-[13px] truncate transition-colors duration-200 flex-1",
            level === 0 ? "font-semibold text-[var(--color-text)] uppercase tracking-wider text-[11px]" : "font-medium",
            isActive
              ? "text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] via-white to-[var(--color-accent)] bg-[length:200%_auto] animate-processing-sweep drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
              : (isOpen ? "text-white" : "text-[var(--color-text-dim)] group-hover:text-[var(--color-text)]")
          )}>
            {node.name}
          </span>

          {/* Action Icons */}
          {isLeaf && (
            <div className="ml-auto hidden group-hover:flex items-center gap-2 shrink-0">
              <button
                className="text-[var(--color-text-dim)] hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-md p-1"
                title="Split View"
                onClick={(e) => {
                  e.stopPropagation();
                  openPane(node.id);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" /><line x1="12" x2="12" y1="3" y2="21" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {hasChildren && node.isExpanded && (
        <div className="flex flex-col ml-4 pl-1 my-1 border-l border-white/5">
          {node.children!.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLast={idx === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const nodes = useStore((state) => state.nodes);
  const activePanes = useStore((state) => state.activePanes);

  return (
    <aside className="h-full w-full flex flex-col flex-shrink-0 select-none overflow-hidden text-[var(--color-text)]">
      <div className="px-6 py-5 shrink-0">
        <div className="flex items-center justify-between whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-700)] shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m4 10 8-8 8 8" /><path d="m4 14 8 8 8-8" /></svg>
            </div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">Hermanos<span className="text-[var(--color-text-dim)] font-medium"> Code</span></h1>
          </div>
          <span className="text-[10px] font-mono text-[var(--color-text-dim)] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/10">v1.1</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex flex-col relative">
          {nodes.map((node, idx) => (
            <TreeNode
              key={node.id}
              node={node}
              isLast={idx === nodes.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 shrink-0 space-y-4">
        <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white border border-[var(--color-brand-400)]/30 rounded-lg py-2 text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] whitespace-nowrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          Add Repository
        </button>

        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--color-text-dim)] uppercase tracking-wider whitespace-nowrap mb-2">
            <span>Active Sessions</span>
            <span className="text-[var(--color-accent)]">{String(activePanes.length).padStart(2, '0')}</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-400)] transition-all duration-300 rounded-full shadow-[0_0_10px_var(--color-accent)]"
              style={{ width: `${Math.min(100, Math.max(10, (activePanes.length / 5) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
