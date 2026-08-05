import React, { useEffect } from 'react';
import { useStore } from './store';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { CommandPalette } from './components/CommandPalette';
import { socket } from './socket';

export default function App() {
  const setConnectionStatus = useStore(s => s.setConnectionStatus);

  // Track socket connection status
  useEffect(() => {
    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnecting = () => setConnectionStatus('connecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnecting);

    // Set initial status
    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnecting);
    };
  }, [setConnectionStatus]);

  return (
    <AppShell>
      <Sidebar />
      <Workspace />
      <CommandPalette />
    </AppShell>
  );
}
