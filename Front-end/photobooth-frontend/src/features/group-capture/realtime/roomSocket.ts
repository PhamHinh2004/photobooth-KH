import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function connectRoomSocket(token: string, roomId: string): Socket {
  const socket = io(`${API_URL}/rooms`, { auth: { token } });
  
  socket.on('connect', () => {
    socket.emit('room:join', roomId);
  });
  
  return socket;
}
