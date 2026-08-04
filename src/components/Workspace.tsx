import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { TerminalPane } from './TerminalPane';
import { EmptyState } from './EmptyState';
import { Group, Panel, Separator } from 'react-resizable-panels';

export const Workspace: React.FC = () => {
  const tabs = useStore(s => s.tabs);
  const activeTab = useStore(s => s.activeTab);
  const layoutMode = useStore(s => s.layoutMode);
  const openTab = useStore(s => s.openTab);
  const nodes = useStore(s => s.nodes);

  const handleCreateSession = () => {
    // Find first unopened leaf node
    const allLeafs: string[] = [];
    const walk = (list: typeof nodes) => {
      for (const n of list) {
        if (!n.children || n.children.length === 0) allLeafs.push(n.id);
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    const unopened = allLeafs.find(id => !tabs.some(t => t.id === id));
    if (unopened) openTab(unopened);
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
          <TerminalPane id={tabs[0].id} />
        </div>
      );
    }

    if (tabs.length === 2) {
      return (
        <Group orientation="horizontal" className="h-full w-full">
          <Panel className="p-1">
            <TerminalPane id={tabs[0].id} />
          </Panel>
          {resizeHandle('rx1', 'horizontal')}
          <Panel className="p-1">
            <TerminalPane id={tabs[1].id} />
          </Panel>
        </Group>
      );
    }

    if (tabs.length === 3) {
      return (
        <Group orientation="horizontal" className="h-full w-full">
          <Panel className="p-1">
            <TerminalPane id={tabs[0].id} />
          </Panel>
          {resizeHandle('rx1', 'horizontal')}
          <Panel>
            <Group orientation="vertical" className="h-full w-full">
              <Panel className="p-1">
                <TerminalPane id={tabs[1].id} />
              </Panel>
              {resizeHandle('ry1', 'vertical')}
              <Panel className="p-1">
                <TerminalPane id={tabs[2].id} />
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
              <TerminalPane id={tabs[0].id} />
            </Panel>
            {resizeHandle('ry1', 'vertical')}
            <Panel className="p-1">
              <TerminalPane id={tabs[2]?.id || tabs[0].id} />
            </Panel>
          </Group>
        </Panel>
        {resizeHandle('rx1', 'horizontal')}
        <Panel>
          <Group orientation="vertical" className="h-full w-full">
            <Panel className="p-1">
              <TerminalPane id={tabs[1].id} />
            </Panel>
            {resizeHandle('ry2', 'vertical')}
            <Panel className="p-1">
              {tabs[3] ? <TerminalPane id={tabs[3].id} /> : <EmptyState onCreateSession={handleCreateSession} />}
            </Panel>
          </Group>
        </Panel>
      </Group>
    );
  };

  // ─── Tab Layout ───
  const renderTabLayout = () => {
    if (!activeTab || tabs.length === 0) {
      return <EmptyState onCreateSession={handleCreateSession} />;
    }

    return (
      <AnimatePresence mode="wait">
        <div key={activeTab} className="h-full w-full p-1">
          <TerminalPane id={activeTab} showHeader={false} />
        </div>
      </AnimatePresence>
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

      {/* Status Bar */}
      <StatusBar />
    </main>
  );
};
