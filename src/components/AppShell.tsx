import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { ConfirmModal } from './ConfirmModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabs = useStore(s => s.tabs);

  // ─── Prevent accidental browser close when sessions are active ───
  useEffect(() => {
    if (tabs.length === 0) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message; returnValue is required for legacy
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [tabs.length]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--color-void)]">
      {/* Custom Confirmation Modal */}
      <ConfirmModal />

      {/* ─── Animated Gradient Mesh Background ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top-right cyan glow */}
        <motion.div
          className="absolute -top-[30%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent), transparent 70%)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        {/* Bottom-left purple glow */}
        <motion.div
          className="absolute -bottom-[20%] -left-[15%] w-[50%] h-[50%] rounded-full opacity-[0.02]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent-secondary), transparent 70%)',
          }}
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 20, -10, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* ─── Scanline Overlay (very subtle) ─── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* ─── Content ─── */}
      <div className="relative z-10 h-full w-full flex">
        {children}
      </div>
    </div>
  );
};
