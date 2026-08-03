import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket } from '../socket';
import { useStore } from '../store';
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

  const isActive = node?.status === 'active';

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm with Premium Obsidian Glass colors
    const term = new Terminal({
      theme: {
        background: '#00000000', // transparent to let glassmorphism show through
        foreground: '#fafafa',   // White text
        cursor: '#818cf8',       // Indigo cursor
        selectionBackground: 'rgba(129, 140, 248, 0.3)', // Indigo selection
      },
      fontFamily: '"JetBrains Mono", monospace, ui-monospace, SFMono-Regular',
      fontSize: 13,
      lineHeight: 1.5, // slightly looser line height for premium feel
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
    const resizeObserver = new ResizeObserver(() => {
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
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-md rounded-xl overflow-hidden relative group/pane border border-white/5 focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300">
      
      {/* Pane Header */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 shrink-0 select-none transition-colors duration-300 group-focus-within/pane:bg-white/10">
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="w-4 h-4 flex items-center justify-center">
            {isActive ? (
              <span className="text-[var(--color-accent)] animate-processing-sweep bg-[length:200%_auto] bg-gradient-to-r from-[var(--color-accent)] via-white to-[var(--color-accent)] text-transparent bg-clip-text font-bold text-lg leading-none mt-1 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">~</span>
            ) : (
              <span className="text-[var(--color-text-dim)] font-mono text-sm">-</span>
            )}
          </div>
          <span className={cn(
            "text-sm font-semibold tracking-wide transition-colors",
            isActive ? "text-white" : "text-[var(--color-text-dim)] group-focus-within/pane:text-white"
          )}>
            {node?.name || id}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            className="text-[var(--color-text-dim)] hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-md p-1.5"
            onClick={() => closePane(id)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
      
      {/* Terminal Container */}
      <div className="flex-1 w-full h-full relative p-3 pb-1" ref={terminalRef}>
        {/* Terminal instance mounts here */}
      </div>
    </div>
  );
};
