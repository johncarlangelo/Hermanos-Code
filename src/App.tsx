import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';

export default function App() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative">
      <Sidebar />
      <Workspace />
      
      {/* Overlay Scanlines / CRT Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-20 z-50"></div>
    </div>
  );
}
