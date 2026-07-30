import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('/', {
  transports: ['polling', 'websocket'], // Try polling first since it's safer in proxied environments, then upgrade
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
