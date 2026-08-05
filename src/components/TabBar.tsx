import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { useConfirmStore } from '../confirmStore';
import { X, Columns2, Rows2, Plus, GripVertical } from 'lucide-react';

export const TabBar: React.FC = () => {
  const tabs = useStore(s => s.tabs);
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const closeTab = useStore(s => s.closeTab);
  const deleteSession = useStore(s => s.deleteSession);
  const reorderTabs = useStore(s => s.reorderTabs);
  const layoutMode = useStore(s => s.layoutMode);
  const toggleLayoutMode = useStore(s => s.toggleLayoutMode);
  const openTab = useStore(s => s.openTab);
  const nodes = useStore(s => s.nodes);

  const createSession = useStore(s => s.createSession);

  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTab(id);
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image transparent
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== targetId) {
      reorderTabs(draggedTab, targetId);
    }
    setDraggedTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
  };

  // Create a brand new session
  const handleAddTab = () => {
    createSession();
  };

  return (
    <div className="h-10 flex items-center bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0 select-none z-10">
      {/* Tabs scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-none gap-0 min-w-0"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTab;
            const isDragging = tab.id === draggedTab;

            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, scaleX: 0.8, width: 0 }}
                animate={{ opacity: isDragging ? 0.4 : 1, scaleX: 1, width: 'auto' }}
                exit={{ opacity: 0, scaleX: 0.8, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center shrink-0"
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, tab.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e as unknown as React.DragEvent, tab.id)}
                onDragEnd={handleDragEnd}
              >
                <button
                  className={`group relative flex items-center gap-2 h-10 px-4 text-[13px] font-medium cursor-pointer transition-colors duration-150
                    ${isActive
                      ? 'text-[var(--color-text-primary)] bg-[var(--color-void)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/3'
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {/* Drag handle - subtle */}
                  <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity shrink-0 cursor-grab" />

                  <span className="truncate max-w-[140px]">{tab.label}</span>

                  {/* Close button */}
                  <span
                    className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all duration-100 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await useConfirmStore.getState().confirm({
                        title: 'Terminate Session',
                        message: `Are you sure you want to close "${tab.label}"? This will terminate the running terminal process.`,
                        confirmLabel: 'Terminate Session',
                        cancelLabel: 'Cancel',
                        variant: 'danger',
                      });
                      if (confirmed) {
                        deleteSession(tab.id);
                      }
                    }}
                    role="button"
                    aria-label={`Close ${tab.label}`}
                  >
                    <X className="w-3 h-3" />
                  </span>

                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]"
                      layoutId="active-tab-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ boxShadow: '0 0 8px var(--color-glow)' }}
                    />
                  )}
                </button>

                {/* Tab separator */}
                <div className="w-px h-4 bg-[var(--color-border)]" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 shrink-0 border-l border-[var(--color-border)]">
        {/* Add tab */}
        <motion.button
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 cursor-pointer transition-colors"
          onClick={handleAddTab}
          whileTap={{ scale: 0.9 }}
          title="New Tab"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        </motion.button>

        {/* Layout toggle */}
        <motion.button
          className={`p-1.5 rounded-md cursor-pointer transition-colors
            ${layoutMode === 'split'
              ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
            }`}
          onClick={toggleLayoutMode}
          whileTap={{ scale: 0.9 }}
          title={layoutMode === 'tabs' ? 'Switch to Split View' : 'Switch to Tab View'}
        >
          {layoutMode === 'tabs' ? (
            <Columns2 className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <Rows2 className="w-3.5 h-3.5" strokeWidth={2} />
          )}
        </motion.button>
      </div>
    </div>
  );
};
