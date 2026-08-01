import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useStore } from './store';

export default function App() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative">
      <Group orientation="horizontal" className="h-full w-full">
        {isSidebarOpen && (
          <>
            <Panel defaultSize={290} minSize={250} maxSize={290}>
              <Sidebar />
            </Panel>
            <Separator className="w-[1px] bg-zinc-900 hover:bg-purple-500 transition-colors duration-300 relative z-50 group">
              <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize z-50"></div>
            </Separator>
          </>
        )}
        <Panel>
          <Workspace />
        </Panel>
      </Group>

      {/* Overlay Scanlines / CRT Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-20 z-50"></div>
    </div>
  );
}
