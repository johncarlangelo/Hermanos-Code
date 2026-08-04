import React from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

export const EmptyState: React.FC<{ onCreateSession?: () => void }> = ({ onCreateSession }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full select-none"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Floating terminal icon */}
      <motion.div
        className="w-20 h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-6 glow-accent-sm"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Terminal className="w-8 h-8 text-[var(--color-accent)] opacity-60" strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight mb-2">
        No active sessions
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center max-w-xs">
        Open an agent from the sidebar or create a new session to begin.
      </p>

      {onCreateSession && (
        <motion.button
          onClick={onCreateSession}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-[var(--color-accent)] text-[var(--color-void)] cursor-pointer
            hover:brightness-110 active:scale-[0.97] transition-all duration-150"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Terminal className="w-4 h-4" strokeWidth={2} />
          New Session
        </motion.button>
      )}

      <div className="mt-8 flex items-center gap-4 text-xs text-[var(--color-text-dim)] font-mono">
        <span className="flex items-center gap-1.5 bg-[var(--color-surface)] px-2.5 py-1 rounded border border-[var(--color-border)]">
          <kbd className="text-[var(--color-text-muted)]">⌘</kbd>
          <kbd className="text-[var(--color-text-muted)]">K</kbd>
          <span className="text-[var(--color-text-muted)] ml-1">Command Palette</span>
        </span>
      </div>
    </motion.div>
  );
};
