import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, FolderGit2, X } from 'lucide-react';
import { useStore } from '../store';

interface AddRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRepoModal: React.FC<AddRepoModalProps> = ({ isOpen, onClose }) => {
  const createWorkspaceGroup = useStore(s => s.createWorkspaceGroup);
  const [repoName, setRepoName] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [branch, setBranch] = useState('main');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    createWorkspaceGroup(repoName.trim(), repoPath.trim() || undefined, branch.trim() || 'main');
    setRepoName('');
    setRepoPath('');
    setBranch('main');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-md rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 25px rgba(6, 182, 212, 0.15)' }}
          >
            {/* Header cyan bar */}
            <div className="h-1 w-full bg-[var(--color-accent)]" />

            <form onSubmit={handleSubmit} className="p-6">
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Icon */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-[var(--color-accent)] border border-cyan-500/20">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-mono tracking-tight">
                    Add Repository Workspace
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Group AI terminal sessions under a distinct Git repo
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Repository Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. hermanos-code, api-service"
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-void)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-zinc-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Repository Working Directory (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C:\Projects\api-service or /home/user/repo"
                    value={repoPath}
                    onChange={e => setRepoPath(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-void)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-[var(--color-accent)]" /> Default Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    onFocus={e => e.target.select()}
                    className="w-full px-3 py-2 bg-[var(--color-void)] border border-[var(--color-border)] rounded-md text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono font-medium rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-semibold rounded-md bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-light)] transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Create Repo Group
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
