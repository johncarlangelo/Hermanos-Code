import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket } from '../socket';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { X, Maximize2, Minus } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalPaneProps {
  id: string;
  showHeader?: boolean;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, showHeader = true }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const closeTab = useStore(s => s.closeTab);
  const activeTab = useStore(s => s.activeTab);

  // Find node
  const nodes = useStore(s => s.nodes);
  const node = (() => {
    let found: any = null;
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
  const isFocused = id === activeTab;

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#00000000',
        foreground: '#E4E4E7',
        cursor: '#06B6D4',
        cursorAccent: '#050507',
        selectionBackground: 'rgba(6, 182, 212, 0.2)',
        selectionForeground: '#FFFFFF',
        black: '#18181B',
        red: '#EF4444',
        green: '#22C55E',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#06B6D4',
        white: '#E4E4E7',
        brightBlack: '#3F3F46',
        brightRed: '#F87171',
        brightGreen: '#4ADE80',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#C084FC',
        brightCyan: '#22D3EE',
        brightWhite: '#FAFAFA',
      },
      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 5000,
    });
    xtermRef.current = term;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);

    // Initial fit
    setTimeout(() => {
      fitAddon.fit();
      socket.emit('create-terminal', {
        id,
        cols: term.cols,
        rows: term.rows
      });
    }, 20);

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
      }, 60);
    });

    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.off(`terminal-data-${id}`, dataHandler);
      socket.emit('kill-terminal', { id });
      term.dispose();
    };
  }, [id]);

  // Status dot config
  const statusDotClass = isActive
    ? 'bg-[var(--color-accent)] animate-pulse-glow'
    : node?.status === 'error'
      ? 'bg-[var(--color-accent-red)] animate-pulse-fast'
      : 'bg-[var(--color-text-dim)]';

  return (
    <motion.div
      className={`flex flex-col h-full w-full rounded-lg overflow-hidden relative
        bg-[var(--color-void)] border transition-all duration-200
        ${isFocused
          ? 'border-[var(--color-border-active)] glow-accent-sm'
          : 'border-[var(--color-border)]'
        }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Pane Header */}
      {showHeader && (
        <div className={`h-9 border-b flex items-center justify-between px-3 shrink-0 select-none transition-colors duration-200
          ${isFocused ? 'border-[var(--color-border-active)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${statusDotClass} shrink-0`} />
            <span className={`text-[12px] font-medium font-mono truncate max-w-[200px] transition-colors
              ${isFocused ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              {node?.name || id}
            </span>
            {isActive && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded">
                live
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => closeTab(id)}
              title="Close"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Terminal Container */}
      <div className="flex-1 w-full h-full relative p-2 pb-1" ref={terminalRef} />
    </motion.div>
  );
};
