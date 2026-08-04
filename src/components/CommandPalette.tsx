import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { Search, Terminal, PanelLeft, Command, Plus, X, Columns2 } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useStore(s => s.commandPaletteOpen);
  const setOpen = useStore(s => s.setCommandPaletteOpen);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleLayoutMode = useStore(s => s.toggleLayoutMode);
  const nodes = useStore(s => s.nodes);
  const openTab = useStore(s => s.openTab);
  const activeTab = useStore(s => s.activeTab);
  const closeTab = useStore(s => s.closeTab);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten nodes for session opening
  const flatNodes = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    const walk = (list: typeof nodes) => {
      for (const n of list) {
        if (!n.children || n.children.length === 0) {
          result.push({ id: n.id, name: n.name });
        }
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    return result;
  }, [nodes]);

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        shortcut: '⌘B',
        icon: <PanelLeft className="w-4 h-4" />,
        action: () => { toggleSidebar(); setOpen(false); },
      },
      {
        id: 'toggle-layout',
        label: 'Toggle Layout Mode',
        shortcut: '⌘L',
        icon: <Columns2 className="w-4 h-4" />,
        action: () => { toggleLayoutMode(); setOpen(false); },
      },
      ...flatNodes.map(n => ({
        id: `open-${n.id}`,
        label: `Open: ${n.name}`,
        icon: <Terminal className="w-4 h-4" />,
        action: () => { openTab(n.id); setOpen(false); },
      })),
    ];

    if (activeTab) {
      items.push({
        id: 'close-tab',
        label: 'Close Active Tab',
        shortcut: '⌘W',
        icon: <X className="w-4 h-4" />,
        action: () => { closeTab(activeTab); setOpen(false); },
      });
    }

    return items;
  }, [flatNodes, activeTab, toggleSidebar, toggleLayoutMode, openTab, closeTab, setOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global ⌘K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, setOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl glass-panel-heavy overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-dim)] outline-none"
                placeholder="Type a command or search..."
              />
              <kbd className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--color-text-dim)]">
                  No commands found
                </div>
              ) : (
                filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left cursor-pointer transition-colors duration-100
                      ${idx === selectedIndex
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-white/5'
                      }`}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className={idx === selectedIndex ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-dim)]'}>
                      {cmd.icon}
                    </span>
                    <span className="flex-1 truncate">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
