import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Wifi, WifiOff } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const connectionStatus = useStore(s => s.connectionStatus);
  const activeTab = useStore(s => s.activeTab);
  const tabs = useStore(s => s.tabs);
  const layoutMode = useStore(s => s.layoutMode);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: { color: 'bg-[var(--color-accent)]', label: 'Connected', icon: Wifi },
    connecting: { color: 'bg-[var(--color-accent-amber)]', label: 'Connecting', icon: Wifi },
    disconnected: { color: 'bg-[var(--color-accent-red)]', label: 'Disconnected', icon: WifiOff },
  };

  const status = statusConfig[connectionStatus];
  const StatusIcon = status.icon;

  return (
    <footer className="h-7 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] select-none shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5 cursor-default" title={status.label}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.color} ${connectionStatus === 'connected' ? 'animate-pulse-glow' : connectionStatus === 'connecting' ? 'animate-pulse-fast' : ''}`} />
          <StatusIcon className="w-3 h-3" strokeWidth={2} />
          <span className="uppercase tracking-wider text-[10px]">{status.label}</span>
        </div>

        {/* Active Sessions */}
        <span className="text-[var(--color-text-dim)]">|</span>
        <span className="uppercase tracking-wider text-[10px]">
          {tabs.length} session{tabs.length !== 1 ? 's' : ''}
        </span>

        {/* Layout Mode */}
        <span className="text-[var(--color-text-dim)]">|</span>
        <span className="uppercase tracking-wider text-[10px]">
          {layoutMode === 'tabs' ? 'Tab' : 'Split'} View
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="uppercase tracking-wider text-[10px]">UTF-8</span>
        <span className="text-[var(--color-text-dim)]">|</span>
        <span className="tabular-nums text-[10px]">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </footer>
  );
};
