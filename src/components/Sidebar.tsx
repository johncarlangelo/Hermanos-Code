import React from 'react';
import { useStore } from '../store';
import { TerminalNode } from '../types';
import { ChevronRight, ChevronDown, TerminalSquare } from 'lucide-react';
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

  return (
    <div className={cn("relative space-y-1", level === 0 && "mt-1")}>
      <div 
        data-tree-node
        tabIndex={0}
        className={cn(
          "flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500/50 relative",
          level > 0 ? "h-8 pl-4" : "h-6"
        )}
        style={level > 0 ? { marginLeft: `${level * 16}px` } : {}}
        onClick={() => {
          if (hasChildren) {
            toggleNodeExpansion(node.id);
          } else {
            openPane(node.id);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasChildren) toggleNodeExpansion(node.id);
            else openPane(node.id);
          } else if (e.key === 'ArrowRight' && hasChildren && !node.isExpanded) {
            e.preventDefault();
            toggleNodeExpansion(node.id);
          } else if (e.key === 'ArrowLeft' && hasChildren && node.isExpanded) {
            e.preventDefault();
            toggleNodeExpansion(node.id);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const focusables = Array.from(document.querySelectorAll<HTMLElement>('[data-tree-node]'));
            const idx = focusables.indexOf(e.currentTarget);
            if (idx >= 0 && idx < focusables.length - 1) focusables[idx + 1].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const focusables = Array.from(document.querySelectorAll<HTMLElement>('[data-tree-node]'));
            const idx = focusables.indexOf(e.currentTarget);
            if (idx > 0) focusables[idx - 1].focus();
          }
        }}
      >
        {/* Connection line from parent (only for children) */}
        {level > 0 && (
          <div className="absolute left-0 top-1/2 w-3 h-[1px] bg-zinc-800"></div>
        )}

        <div className="flex items-center gap-3 w-full">
          {hasChildren ? (
            <div className="w-4 h-4 flex items-center justify-center text-zinc-500">
              {node.isExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {node.status === 'active' && (
                <div className="absolute w-5 h-5 bg-indigo-500/40 rounded-full blur-[4px] animate-pulse"></div>
              )}
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300 relative z-10",
                  node.status === 'active' 
                    ? "bg-indigo-400 shadow-[0_0_8px_2px_rgba(129,140,248,0.8)]" 
                    : "bg-zinc-700"
                )}
              />
            </div>
          )}
          
          <span className={cn(
            "text-xs truncate transition-colors duration-300 font-mono tracking-tight",
            level === 0 ? "font-semibold" : "",
            node.status === 'active' 
              ? "italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-[length:200%_auto] animate-gradient-x font-medium drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
              : (isOpen ? "text-white not-italic" : (level === 0 ? "text-zinc-400 not-italic" : "text-zinc-500 group-hover:text-zinc-300 not-italic"))
          )}>
            {node.name}
          </span>
          
          {/* Hover Actions / Badges */}
          {isLeaf && (
            <div className="ml-auto hidden group-hover:flex items-center gap-1 shrink-0 bg-zinc-950/80 px-1 rounded shadow-sm">
              <button 
                className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                title={node.status === 'active' ? "Restart Agent" : "Start Agent"}
                onClick={(e) => { e.stopPropagation(); /* stub */ }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
              </button>
              <button 
                className="p-1 text-zinc-500 hover:text-purple-400 hover:bg-zinc-800 rounded transition-colors"
                title="Split View"
                onClick={(e) => {
                  e.stopPropagation();
                  openPane(node.id);
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/></svg>
              </button>
            </div>
          )}
          
          {isLeaf && node.status === 'active' && (
            <span className="ml-auto text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono group-hover:hidden transition-all shrink-0">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Children Container (with left border for hierarchy) */}
      {hasChildren && node.isExpanded && (
        <div className={cn(
          "flex flex-col space-y-1",
          level === 0 ? "ml-4 border-l border-zinc-800" : "border-l border-zinc-800"
        )} style={level > 0 ? { marginLeft: `${level * 16}px` } : {}}>
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
    <aside className="h-full w-full bg-zinc-950 border-r border-zinc-900 flex flex-col flex-shrink-0 select-none overflow-hidden">
      <div className="p-6 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse-glow shrink-0"></div>
          <h1 className="text-sm font-bold tracking-widest text-white uppercase">Hermanos Code</h1>
        </div>
        <p className="text-xs text-zinc-500 mt-1 font-mono whitespace-nowrap">Command Center v1.0.4-stable</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="flex flex-col relative space-y-1">
          {nodes.map((node, idx) => (
            <TreeNode 
              key={node.id} 
              node={node} 
              isLast={idx === nodes.length - 1} 
            />
          ))}
        </div>
      </div>
      <div className="mt-auto p-4 border-t border-zinc-900 space-y-3 shrink-0">
         {/* Add Repository Button */}
         <button className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded py-1.5 text-xs font-medium transition-colors mb-4 whitespace-nowrap">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
           Add Repository
         </button>
         
         <div className="flex justify-between items-center text-xs font-medium text-zinc-400 whitespace-nowrap">
            <span>Active Sessions</span>
            <span className="text-purple-500">{String(activePanes.length).padStart(2, '0')}</span>
         </div>
         <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, (activePanes.length / 5) * 100))}%` }}
            ></div>
         </div>
      </div>
    </aside>
  );
};
