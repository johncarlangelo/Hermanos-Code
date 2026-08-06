import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { TerminalPane } from './TerminalPane';
import { EmptyState } from './EmptyState';
import { Group, Panel, Separator } from 'react-resizable-panels';

// ─── Persistent Terminal Slot Portal ───
// Portals a persistent TerminalPane instance into the active layout slot (tab slot vs split slot)
// so the component instance, xterm.js instance, WebSocket, and PTY process never unmount when toggling views.
const PersistentTerminalSlot: React.FC<{ id: string }> = ({ id }) => {
  const layoutMode = useStore(s => s.layoutMode);
  const targetId = layoutMode === 'tabs' ? `tab-slot-${id}` : `split-slot-${id}`;
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let animationFrameId: number;

    const updateContainer = () => {
      const el = document.getElementById(targetId);
      if (el) {
        setContainer(el);
      } else {
        animationFrameId = requestAnimationFrame(updateContainer);
      }
    };

    updateContainer();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetId, layoutMode, id]);

  if (!container) return null;

  return createPortal(
    <TerminalPane id={id} showHeader={layoutMode === 'split'} />,
    container
  );
};

export const Workspace: React.FC = () => {
  const tabs = useStore(s => s.tabs);
  const activeTab = useStore(s => s.activeTab);
  const layoutMode = useStore(s => s.layoutMode);
  const createSession = useStore(s => s.createSession);

  const handleCreateSession = () => {
    createSession();
  };

  // ─── Resize Handle ───
  const resizeHandle = (key: string, direction: 'horizontal' | 'vertical') => (
    <Separator
      key={key}
      className={`${direction === 'horizontal' ? 'w-1' : 'h-1'} bg-transparent hover:bg-[var(--color-accent)]/15 transition-colors duration-200 relative z-30 group ${direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'}`}
    >
      <div className={`absolute ${direction === 'horizontal' ? 'inset-y-0 left-1/2 w-px' : 'inset-x-0 top-1/2 h-px'} bg-[var(--color-border)] group-hover:bg-[var(--color-accent)]/40 transition-colors duration-200`} />
    </Separator>
  );

  // ─── Split Pane Layout ───
  const renderSplitLayout = () => {
    if (tabs.length === 0) return <EmptyState onCreateSession={handleCreateSession} />;

    if (tabs.length === 1) {
      return (
        <div className="h-full w-full p-1">
          <div id={`split-slot-${tabs[0].id}`} className="h-full w-full relative" />
        </div>
      );
    }

    if (tabs.length === 2) {
      return (
        <Group orientation="horizontal" className="h-full w-full">
          <Panel className="p-1">
            <div id={`split-slot-${tabs[0].id}`} className="h-full w-full relative" />
          </Panel>
          {resizeHandle('rx1', 'horizontal')}
          <Panel className="p-1">
            <div id={`split-slot-${tabs[1].id}`} className="h-full w-full relative" />
          </Panel>
        </Group>
      );
    }

    if (tabs.length === 3) {
      return (
        <Group orientation="horizontal" className="h-full w-full">
          <Panel className="p-1">
            <div id={`split-slot-${tabs[0].id}`} className="h-full w-full relative" />
          </Panel>
          {resizeHandle('rx1', 'horizontal')}
          <Panel>
            <Group orientation="vertical" className="h-full w-full">
              <Panel className="p-1">
                <div id={`split-slot-${tabs[1].id}`} className="h-full w-full relative" />
              </Panel>
              {resizeHandle('ry1', 'vertical')}
              <Panel className="p-1">
                <div id={`split-slot-${tabs[2].id}`} className="h-full w-full relative" />
              </Panel>
            </Group>
          </Panel>
        </Group>
      );
    }

    // 4+ tabs: 2x2 grid
    return (
      <Group orientation="horizontal" className="h-full w-full">
        <Panel>
          <Group orientation="vertical" className="h-full w-full">
            <Panel className="p-1">
              <div id={`split-slot-${tabs[0].id}`} className="h-full w-full relative" />
            </Panel>
            {resizeHandle('ry1', 'vertical')}
            <Panel className="p-1">
              <div id={`split-slot-${tabs[2]?.id || tabs[0].id}`} className="h-full w-full relative" />
            </Panel>
          </Group>
        </Panel>
        {resizeHandle('rx1', 'horizontal')}
        <Panel>
          <Group orientation="vertical" className="h-full w-full">
            <Panel className="p-1">
              <div id={`split-slot-${tabs[1].id}`} className="h-full w-full relative" />
            </Panel>
            {resizeHandle('ry2', 'vertical')}
            <Panel className="p-1">
              {tabs[3] ? (
                <div id={`split-slot-${tabs[3].id}`} className="h-full w-full relative" />
              ) : (
                <EmptyState onCreateSession={handleCreateSession} />
              )}
            </Panel>
          </Group>
        </Panel>
      </Group>
    );
  };

  // ─── Tab Layout ───
  const renderTabLayout = () => {
    if (tabs.length === 0) {
      return <EmptyState onCreateSession={handleCreateSession} />;
    }

    // VS Code-style: render ALL terminal slots at full size, hide inactive ones
    // with visibility:hidden (preserves container dimensions so xterm never
    // resizes to 0 columns). Active terminal sits on top via z-index.
    return (
      <>
        {tabs.map(tab => {
          const isVisible = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              className="h-full w-full p-1 absolute inset-0"
              style={{
                visibility: isVisible ? 'visible' : 'hidden',
                zIndex: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
              }}
            >
              <div id={`tab-slot-${tab.id}`} className="h-full w-full relative" />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <main className="h-full flex-1 min-w-0 flex flex-col bg-transparent">
      {/* Tab Bar */}
      <TabBar />

      {/* Terminal Area */}
      <div className="flex-1 min-h-0 w-full relative">
        {layoutMode === 'tabs' ? renderTabLayout() : renderSplitLayout()}
      </div>

      {/* Persistent Terminal Instances — Portaled into active slots */}
      {tabs.map(tab => (
        <PersistentTerminalSlot key={tab.id} id={tab.id} />
      ))}

      {/* Status Bar */}
      <StatusBar />
    </main>
  );
};
