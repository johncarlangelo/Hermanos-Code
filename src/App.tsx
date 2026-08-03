import React from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';

export default function App() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text)] overflow-hidden selection:bg-[var(--color-accent)] selection:text-white relative">
      
      {/* Premium Background Depth */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-brand-900)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_left,_rgba(129,140,248,0.05)_0%,_transparent_50%)] opacity-40 mix-blend-screen pointer-events-none"></div>

      <div className="h-full w-full flex relative z-10">
        {isSidebarOpen && (
          <div className="w-[300px] shrink-0 h-full bg-[var(--color-bg-glass)] backdrop-blur-3xl border-r border-[var(--color-border)]">
            <Sidebar />
          </div>
        )}
        <div className="flex-1 min-w-0 h-full bg-transparent">
          <Workspace />
        </div>
      </div>
    </div>
  );
}
