import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useConfirmStore } from '../confirmStore';

export const ConfirmModal: React.FC = () => {
  const { isOpen, options, close } = useConfirmStore();

  if (!options) return null;

  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
  } = options;

  const isDanger = variant === 'danger';

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
            onClick={() => close(false)}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-md rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              boxShadow: isDanger
                ? '0 0 25px rgba(239, 68, 68, 0.15)'
                : '0 0 25px rgba(6, 182, 212, 0.15)',
            }}
          >
            {/* Header bar accent */}
            <div
              className={`h-1 w-full ${
                isDanger ? 'bg-[var(--color-accent-red)]' : 'bg-[var(--color-accent)]'
              }`}
            />

            <div className="p-6">
              {/* Close button top right */}
              <button
                onClick={() => close(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isDanger
                      ? 'bg-red-500/10 text-[var(--color-accent-red)] border border-red-500/20'
                      : 'bg-cyan-500/10 text-[var(--color-accent)] border border-cyan-500/20'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-mono tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="px-4 py-2 text-xs font-mono font-medium rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 border border-transparent transition-colors cursor-pointer"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`px-4 py-2 text-xs font-mono font-medium rounded-md text-white transition-all shadow-md cursor-pointer ${
                    isDanger
                      ? 'bg-[var(--color-accent-red)] hover:bg-red-600 active:scale-95'
                      : 'bg-[var(--color-accent)] text-black font-semibold hover:bg-[var(--color-accent-light)] active:scale-95'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
