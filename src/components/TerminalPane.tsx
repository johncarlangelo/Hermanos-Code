import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket } from '../socket';
import { useStore } from '../store';
import { X, SplitSquareHorizontal } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface TerminalPaneProps {
  id: string;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const closePane = useStore((state) => state.closePane);
  
  // Find node name
  const nodes = useStore((state) => state.nodes);
  const node = (() => {
    let found = null;
    const search = (nList: any[]) => {
      for (const n of nList) {
        if (n.id === id) found = n;
        if (n.children) search(n.children);
      }
    };
    search(nodes);
    return found;
  })();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#e4e4e7',
        cursor: '#a855f7',
        selectionBackground: 'rgba(168, 85, 247, 0.3)',
      },
      fontFamily: '"JetBrains Mono", monospace, ui-monospace, SFMono-Regular',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: true,
    });
    xtermRef.current = term;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    // Initial fit needs a tiny delay to ensure DOM is ready
    setTimeout(() => {
      fitAddon.fit();
      
      // Tell backend to create terminal with current size
      socket.emit('create-terminal', {
        id,
        cols: term.cols,
        rows: term.rows
      });
    }, 10);

    // Handle input
    term.onData((data) => {
      socket.emit('terminal-input', { id, input: data });
    });

    // Handle output
    const dataHandler = (data: string) => {
      term.write(data);
    };
    socket.on(`terminal-data-${id}`, dataHandler);

    // Resize observer
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current && xtermRef.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = xtermRef.current;
          socket.emit('resize-terminal', { id, cols, rows });
        }
      }, 50);
    });

    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.off(`terminal-data-${id}`, dataHandler);
      socket.emit('kill-terminal', { id });
      term.dispose();
    };
  }, [id]);

  return (
    <div className="flex flex-col h-full w-full bg-black border-none rounded-none overflow-hidden relative">
      {/* Pane Header */}
      <div className="h-8 border-b border-zinc-900 flex items-center justify-between px-3 bg-zinc-950 shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Status Dot matching Sidebar */}
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              node?.status === 'active' 
                ? "bg-purple-500 animate-pulse-glow" 
                : "bg-zinc-600"
            )}
          />
          <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">{node?.name || id}</span>
        </div>
        <div className="flex gap-2">
          <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
          </button>
          <button 
            className="text-zinc-600 hover:text-red-400 transition-colors"
            onClick={() => closePane(id)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
      
      {/* Terminal Container */}
      <div className="flex-1 w-full h-full relative p-2" ref={terminalRef} />
    </div>
  );
};
