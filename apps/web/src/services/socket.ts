import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Retorna una instancia compartida única (singleton) del cliente Socket.IO.
 * Esto evita crear y abortar sockets nativos en cada ciclo de vida/re-render de React,
 * previniendo el error "WebSocket is closed before the connection is established".
 */
export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', () => {
      // Manejar reconexión silenciosamente mientras el servidor está ocupado o reiniciando
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
