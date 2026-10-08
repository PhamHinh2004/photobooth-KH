import { io, Socket } from 'socket.io-client';
import { API_SOCKET_ORIGIN } from '@/api/apiConfig';

export function connectRoomSocket(token: string, roomId: string): Socket {
  const socket = io(`${API_SOCKET_ORIGIN}/rooms`, { auth: { token } });
  
  socket.on('connect', () => {
    socket.emit('room:join', roomId);
  });
  
  return socket;
}

export function syncServerClock(socket: Socket): Promise<number> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timeout = window.setTimeout(() => resolve(0), 3000);

    socket.emit('room:time_sync', (response: { serverTime?: number }) => {
      window.clearTimeout(timeout);
      const receivedAt = Date.now();
      if (typeof response?.serverTime !== 'number') {
        resolve(0);
        return;
      }

      const estimatedClientTimeAtResponse = startedAt + (receivedAt - startedAt) / 2;
      resolve(response.serverTime - estimatedClientTimeAtResponse);
    });
  });
}
