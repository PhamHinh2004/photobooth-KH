import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket | null = null;

export const useSocialSocket = (token?: string) => {
  const [feed, setFeed] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(`${SOCKET_URL}/social`, {
        transports: ['websocket'],
        auth: { token },
      });
    }

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('post:created', (post) => {
      setFeed((prev) => [post, ...prev]);
    });

    socket.on('post:updated', (updatedPost) => {
      setFeed((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    });

    socket.on('post:deleted', (postId) => {
      setFeed((prev) => prev.filter((p) => p.id !== postId));
    });

    socket.on('post:liked', ({ postId, likesCount }) => {
      setFeed((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: likesCount } : p)));
    });

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('post:created');
        socket.off('post:updated');
        socket.off('post:deleted');
        socket.off('post:liked');
      }
    };
  }, [token]);

  const joinPost = (postId: string) => {
    if (socket) {
      socket.emit('join:post', postId);
      socket.on('comment:created', (comment) => {
        setComments((prev) => [...prev, comment]);
      });
      socket.on('comment:updated', (updatedComment) => {
        setComments((prev) => prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)));
      });
      socket.on('comment:deleted', (commentId) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      });
    }
  };

  const leavePost = (postId: string) => {
    if (socket) {
      socket.emit('leave:post', postId);
      socket.off('comment:created');
      socket.off('comment:updated');
      socket.off('comment:deleted');
    }
  };

  const resetComments = () => setComments([]);

  return { feed, setFeed, comments, setComments, isConnected, joinPost, leavePost, resetComments };
};
