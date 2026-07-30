import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
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
  const terminals: Record<string, ChildProcessWithoutNullStreams> = {};

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('create-terminal', (data) => {
      const { id, cols = 80, rows = 24 } = data;
      console.log(`Creating terminal ${id}`);
      
      const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
      
      try {
        const ptyProcess = spawn(shell, [], {
          cwd: process.env.HOME || process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-color',
            COLORTERM: 'truecolor'
          } as NodeJS.ProcessEnv
        });

        terminals[id] = ptyProcess;

        ptyProcess.stdout.on('data', (output) => {
          socket.emit(`terminal-data-${id}`, output.toString());
        });

        ptyProcess.stderr.on('data', (output) => {
          socket.emit(`terminal-data-${id}`, output.toString());
        });

        ptyProcess.on('exit', (exitCode, signal) => {
          console.log(`Terminal ${id} exited with code ${exitCode}`);
          socket.emit(`terminal-exit-${id}`, { exitCode, signal });
          delete terminals[id];
        });
        
        // initial prompt
        socket.emit(`terminal-data-${id}`, `\r\nConnected to simulated terminal (${id})\r\n$ `);
      } catch (err) {
        console.error("Failed to spawn process", err);
        socket.emit(`terminal-data-${id}`, `\r\nError starting terminal: ${String(err)}\r\n`);
      }
    });

    socket.on('terminal-input', (data) => {
      const { id, input } = data;
      const ptyProcess = terminals[id];
      if (ptyProcess && ptyProcess.stdin) {
        ptyProcess.stdin.write(input);
      }
    });

    socket.on('resize-terminal', (data) => {
      // Mock resize, child_process doesn't support pty resize natively
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
