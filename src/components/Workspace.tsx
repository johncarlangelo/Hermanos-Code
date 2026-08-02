import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useStore } from '../store';
import { TerminalPane } from './TerminalPane';
import { DataCore } from './DataCore';
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
  const [activeView, setActiveView] = useState<'sessions' | 'metrics'>('sessions');

  const handleViewChange = (view: 'sessions' | 'metrics') => {
    if (view === activeView) return;
    if (!(document as any).startViewTransition) {
      setActiveView(view);
      return;
    }
    (document as any).startViewTransition(() => {
      flushSync(() => {
        setActiveView(view);
      });
    });
  };

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

  return (
    <main className="h-full w-full flex flex-col bg-zinc-950 z-10 relative">
      {/* Command Center Header */}
      <header className="h-12 border-b border-zinc-900 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSidebar}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Toggle Sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Canvas</span>
            <span className="text-zinc-300">Default Grid</span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800"></div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleViewChange('sessions')}
              className={cn("text-xs transition-colors pb-3 mt-3", activeView === 'sessions' ? "text-white border-b border-purple-500 font-medium" : "text-zinc-400 hover:text-white")}
            >
              Terminal
            </button>
            <button 
              onClick={() => handleViewChange('metrics')}
              className={cn("text-xs transition-colors pb-3 mt-3", activeView === 'metrics' ? "text-white border-b border-purple-500 font-medium" : "text-zinc-400 hover:text-white")}
            >
              Metrics
            </button>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              className="block w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-zinc-900 transition-all font-mono" 
              placeholder="Search or enter command (e.g. /dispatch)"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
               <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">⌘K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-mono text-zinc-400">System Idle</span>
          </div>
        </div>
      </header>

      {/* Main Grid Canvas */}
      <div className="flex-1 min-h-0 w-full relative" style={{ viewTransitionName: 'workspace-canvas' as any }}>
      {activeView === 'metrics' ? (
        <DataCore />
      ) : (() => {
        if (activePanes.length === 0) {
          return (
            <div className="flex-1 min-h-0 w-full bg-zinc-900 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-zinc-500 text-sm font-medium">No active agents</h2>
              </div>
            </div>
          );
        }

        const renderPane = (paneId: string) => (
          <Panel key={paneId} className={cn("relative flex flex-col bg-black transition-opacity duration-200", draggedPane === paneId ? "opacity-50" : "opacity-100")}>
            <div 
              className="w-full h-full relative"
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
          <Separator key={key} className="w-[1px] bg-zinc-800 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-300 relative z-50 group">
            <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize z-50"></div>
          </Separator>
        );

        const resizeHandleY = (key: string) => (
          <Separator key={key} className="h-[1px] bg-zinc-800 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-300 relative z-50 group">
            <div className="absolute inset-x-0 -top-2 -bottom-2 cursor-row-resize z-50"></div>
          </Separator>
        );

        const renderGrid = () => {
          if (activePanes.length === 1) {
            return (
              <div className="flex-1 min-h-0 w-full bg-zinc-900">
                <Group orientation="horizontal" className="h-full w-full">
                  {renderPane(activePanes[0])}
                </Group>
              </div>
            );
          }

          if (activePanes.length === 2) {
            return (
              <div className="flex-1 min-h-0 w-full bg-zinc-900">
                <Group orientation="horizontal" className="h-full w-full">
                  {renderPane(activePanes[0])}
                  {resizeHandleX('rx1')}
                  {renderPane(activePanes[1])}
                </Group>
              </div>
            );
          }

          if (activePanes.length === 3) {
            return (
              <div className="flex-1 min-h-0 w-full bg-zinc-900">
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
              </div>
            );
          }

          return (
            <div className="flex-1 min-h-0 w-full bg-zinc-900">
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
            </div>
          );
        };

        return renderGrid();
      })()}
      </div>

      {/* Terminal Status Bar */}
      <footer className="h-8 border-t border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500"></div> CPU: 12%</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-zinc-700"></div> MEM: 1.2GB</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-zinc-700">UTF-8</span>
          <span className="text-zinc-700">Terminal Ready</span>
          <span className="text-white border border-zinc-800 px-2 py-0.5 rounded">82 x 44</span>
        </div>
      </footer>
    </main>
  );
};
