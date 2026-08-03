import React, { useState } from 'react';
import { useStore } from '../store';
import { TerminalPane } from './TerminalPane';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Group, Panel, Separator } from 'react-resizable-panels';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const Workspace: React.FC = () => {
  const activePanes = useStore((state) => state.activePanes);
  const reorderPanes = useStore((state) => state.reorderPanes);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const [draggedPane, setDraggedPane] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPane(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedPane && draggedPane !== targetId) {
      reorderPanes(draggedPane, targetId);
    }
    setDraggedPane(null);
  };

  const renderPane = (paneId: string) => (
    <Panel key={paneId} className={cn("relative flex flex-col transition-opacity duration-200", draggedPane === paneId ? "opacity-50" : "opacity-100")}>
      <div 
        className="w-full h-full relative p-2"
        draggable
        onDragStart={(e) => handleDragStart(e, paneId)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, paneId)}
      >
        <TerminalPane id={paneId} />
      </div>
    </Panel>
  );

  const resizeHandleX = (key: string) => (
    <Separator key={key} className="w-2 bg-transparent hover:bg-[var(--color-accent)]/20 transition-colors duration-300 relative z-50 group cursor-col-resize">
      <div className="absolute inset-y-0 -left-1 -right-1 z-50"></div>
      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[var(--color-border)] group-hover:bg-[var(--color-accent)] shadow-[0_0_10px_transparent] group-hover:shadow-[0_0_10px_var(--color-accent)] transition-all duration-300"></div>
    </Separator>
  );

  const resizeHandleY = (key: string) => (
    <Separator key={key} className="h-2 bg-transparent hover:bg-[var(--color-accent)]/20 transition-colors duration-300 relative z-50 group cursor-row-resize">
      <div className="absolute inset-x-0 -top-1 -bottom-1 z-50"></div>
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[var(--color-border)] group-hover:bg-[var(--color-accent)] shadow-[0_0_10px_transparent] group-hover:shadow-[0_0_10px_var(--color-accent)] transition-all duration-300"></div>
    </Separator>
  );

  return (
    <main className="h-full w-full flex flex-col z-10 relative text-[var(--color-text)]">
      {/* Premium Header */}
      <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSidebar}
            className="text-[var(--color-text-dim)] hover:text-white transition-colors p-1.5 -ml-1.5 rounded-md hover:bg-white/10"
            title="Toggle Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="4"/><line x1="9" x2="9" y1="3" y2="21"/></svg>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[15px] tracking-tight">Studio Canvas</span>
            <span className="bg-[var(--color-brand-900)] text-[var(--color-brand-200)] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--color-brand-700)] shadow-[0_0_10px_rgba(79,70,229,0.2)]">Grid Active</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--color-text-dim)] group-focus-within:text-[var(--color-accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
              type="text" 
              className="block w-full pl-9 pr-12 py-1.5 bg-black/40 border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-all shadow-inner" 
              placeholder="Search workspaces or type a command..."
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
               <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-white/5 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 border border-emerald-500/30 rounded-lg bg-emerald-500/10 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-[11px] font-semibold text-emerald-300 tracking-wide">System Idle</span>
          </div>
        </div>
      </header>

      {/* Main Grid Canvas */}
      <div className="flex-1 min-h-0 w-full relative z-10 p-2">
      {(() => {
        if (activePanes.length === 0) {
          return (
            <div className="flex-1 h-full w-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                </div>
                <h2 className="text-white text-lg font-semibold tracking-tight">The canvas is empty</h2>
                <p className="text-[var(--color-text-dim)] text-sm">Open an agent from the sidebar to begin processing.</p>
              </div>
            </div>
          );
        }

        const renderGrid = () => {
          if (activePanes.length === 1) {
            return (
              <Group orientation="horizontal" className="h-full w-full">
                {renderPane(activePanes[0])}
              </Group>
            );
          }

          if (activePanes.length === 2) {
            return (
              <Group orientation="horizontal" className="h-full w-full">
                {renderPane(activePanes[0])}
                {resizeHandleX('rx1')}
                {renderPane(activePanes[1])}
              </Group>
            );
          }

          if (activePanes.length === 3) {
            return (
              <Group orientation="horizontal" className="h-full w-full">
                {renderPane(activePanes[0])}
                {resizeHandleX('rx1')}
                <Panel>
                  <Group orientation="vertical" className="h-full w-full">
                    {renderPane(activePanes[1])}
                    {resizeHandleY('ry1')}
                    {renderPane(activePanes[2])}
                  </Group>
                </Panel>
              </Group>
            );
          }

          return (
            <Group orientation="horizontal" className="h-full w-full">
              <Panel>
                <Group orientation="vertical" className="h-full w-full">
                  {renderPane(activePanes[0])}
                  {resizeHandleY('ry1')}
                  {renderPane(activePanes[2] || activePanes[1])}
                </Group>
              </Panel>
              {resizeHandleX('rx1')}
              <Panel>
                <Group orientation="vertical" className="h-full w-full">
                  {renderPane(activePanes[1])}
                  {resizeHandleY('ry2')}
                  {activePanes[3] ? renderPane(activePanes[3]) : null}
                </Group>
              </Panel>
            </Group>
          );
        };

        return renderGrid();
      })()}
      </div>

      {/* Terminal Status Bar */}
      <footer className="h-8 border-t border-[var(--color-border)] bg-black/40 backdrop-blur-md px-6 flex items-center justify-between text-[11px] font-mono text-[var(--color-text-dim)] shrink-0 uppercase tracking-widest z-20">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full shadow-[0_0_8px_var(--color-accent)]"></div> CPU: 12%</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div> MEM: 1.2GB</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="hover:text-white transition-colors cursor-pointer">UTF-8</span>
          <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">82 x 44</span>
        </div>
      </footer>
    </main>
  );
};
