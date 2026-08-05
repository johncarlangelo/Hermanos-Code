import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { socket } from '../socket';
import { useStore } from '../store';
import { useConfirmStore } from '../confirmStore';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalPaneProps {
  id: string;
  showHeader?: boolean;
}

// Idle timeout: if no output for this duration, mark as idle
const IDLE_TIMEOUT_MS = 3000;

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, showHeader = true }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const deleteSession = useStore(s => s.deleteSession);
  const activeTab = useStore(s => s.activeTab);
  const updateNodeStatus = useStore(s => s.updateNodeStatus);
  const renameNode = useStore(s => s.renameNode);

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

  const isActive = node?.status === 'active' || node?.status === 'running';
  const isFocused = id === activeTab;

  // Use refs for callbacks to avoid stale closures in socket handlers
  const updateNodeStatusRef = useRef(updateNodeStatus);
  updateNodeStatusRef.current = updateNodeStatus;
  const renameNodeRef = useRef(renameNode);
  renameNodeRef.current = renameNode;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Prevent double-mount issues
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }

    mountedRef.current = true;

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

    // Initial fit + create PTY
    const initTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      fitAddon.fit();
      socket.emit('create-terminal', {
        id,
        cols: term.cols,
        rows: term.rows
      });
    }, 50);

    // ─── Dynamic session naming ───
    // On Windows, cmd.exe sends CWD as the terminal title.
    // On Unix, bash/zsh can be configured to send title escape sequences.
    term.onTitleChange((title) => {
      if (!mountedRef.current || !title) return;
      // Extract just the folder name from the path for a cleaner label
      const parts = title.replace(/\\/g, '/').split('/');
      const shortName = parts[parts.length - 1] || title;
      renameNodeRef.current(id, shortName);
    });

    // Handle user input
    term.onData((data) => {
      socket.emit('terminal-input', { id, input: data });
      // Mark running
      updateNodeStatusRef.current(id, 'running');
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (mountedRef.current) updateNodeStatusRef.current(id, 'idle');
      }, IDLE_TIMEOUT_MS);
    });

    // Handle terminal output
    const dataHandler = (data: string) => {
      if (!mountedRef.current) return;
      term.write(data);
      // Mark running
      updateNodeStatusRef.current(id, 'running');
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (mountedRef.current) updateNodeStatusRef.current(id, 'idle');
      }, IDLE_TIMEOUT_MS);
    };
    socket.on(`terminal-data-${id}`, dataHandler);

    // Handle terminal exit
    const exitHandler = () => {
      if (mountedRef.current) {
        updateNodeStatusRef.current(id, 'disconnected');
      }
    };
    socket.on(`terminal-exit-${id}`, exitHandler);

    // Resize observer — skip when container has zero dimensions
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!fitAddonRef.current || !xtermRef.current || !mountedRef.current) return;
        // Skip resize if container collapsed to zero (e.g. during hide)
        const entry = entries[0];
        if (entry && (entry.contentRect.width === 0 || entry.contentRect.height === 0)) return;
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        socket.emit('resize-terminal', { id, cols, rows });
      }, 60);
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      socket.off(`terminal-data-${id}`, dataHandler);
      socket.off(`terminal-exit-${id}`, exitHandler);
      socket.emit('kill-terminal', { id });
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [id]);

  // ─── VS Code-style refit on tab switch ───
  // When this terminal becomes the active tab, refit to the container's
  // current dimensions and refresh all visible rows to fix any rendering
  // artifacts from being hidden.
  useEffect(() => {
    if (!isFocused) return;
    // Small delay to ensure the container is fully visible and has dimensions
    const timer = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current && mountedRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        // Refresh all visible lines to re-render content
        xtermRef.current.refresh(0, rows - 1);
        // Sync the new dimensions with the PTY backend
        socket.emit('resize-terminal', { id, cols, rows });
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [isFocused, id]);

  // Handle close — kill terminal + remove session
  const handleClose = async () => {
    const label = node?.name || id;
    const confirmed = await useConfirmStore.getState().confirm({
      title: 'Terminate Session',
      message: `Are you sure you want to close "${label}"? This will terminate the running terminal process.`,
      confirmLabel: 'Terminate Session',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      deleteSession(id);
    }
  };

  // Status dot config
  const statusDotClass = isActive
    ? 'bg-[var(--color-accent)] animate-pulse-glow'
    : node?.status === 'error'
      ? 'bg-[var(--color-accent-red)] animate-pulse-fast'
      : node?.status === 'disconnected'
        ? 'bg-[var(--color-accent-amber)]'
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
              onClick={handleClose}
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
