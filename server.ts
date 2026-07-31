import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import * as pty from 'node-pty';
import os from 'os';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Socket.io for Terminal multiplexing
  const terminals: Record<string, pty.IPty> = {};

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('create-terminal', (data) => {
      const { id, cols = 80, rows = 24 } = data;
      console.log(`Creating terminal ${id}`);
      
      const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
      
      try {
        const ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: cols || 80,
          rows: rows || 24,
          cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
          env: process.env as Record<string, string>
        });

        terminals[id] = ptyProcess;

        ptyProcess.onData((data) => {
          socket.emit(`terminal-data-${id}`, data);
        });

        ptyProcess.onExit(({ exitCode, signal }) => {
          console.log(`Terminal ${id} exited with code ${exitCode}`);
          socket.emit(`terminal-exit-${id}`, { exitCode, signal });
          delete terminals[id];
        });
        
        // initial prompt
        socket.emit(`terminal-data-${id}`, `\r\nConnected to real PTY terminal (${id})\r\n`);
      } catch (err) {
        console.error("Failed to spawn process", err);
        socket.emit(`terminal-data-${id}`, `\r\nError starting terminal: ${String(err)}\r\n`);
      }
    });

    socket.on('terminal-input', (data) => {
      const { id, input } = data;
      const ptyProcess = terminals[id];
      if (ptyProcess) {
        ptyProcess.write(input);
      }
    });

    socket.on('resize-terminal', (data) => {
      const { id, cols, rows } = data;
      const ptyProcess = terminals[id];
      if (ptyProcess && cols && rows) {
        try {
          ptyProcess.resize(cols, rows);
        } catch (e) {
          console.error(`Failed to resize terminal ${id}`, e);
        }
      }
    });

    socket.on('kill-terminal', (data) => {
      const { id } = data;
      const ptyProcess = terminals[id];
      if (ptyProcess) {
        ptyProcess.kill();
        delete terminals[id];
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
