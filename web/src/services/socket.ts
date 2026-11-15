import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Retorna una instancia compartida única (singleton) del cliente Socket.IO autenticada con JWT.
 */
export function getSocket(): Socket {
  const token = localStorage.getItem('accessToken');

  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      auth: {
        token: token || '',
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', () => {
      // Manejar reconexión silenciosamente
    });
  } else if (token && socket.auth && (socket.auth as any).token !== token) {
    // Si cambió el token (por ejemplo login nuevo), actualizarlo y reconectar
    socket.auth = { token };
    socket.disconnect().connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
