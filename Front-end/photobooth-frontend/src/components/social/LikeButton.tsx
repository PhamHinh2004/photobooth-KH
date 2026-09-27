import React, { useState, useEffect } from 'react';
import { socialApi } from '../../api/social.api';
import { useAuthStore } from '../../stores/auth.store';
import { message } from 'antd';

export function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const isAuthenticated = useAuthStore((state) => !!state.token);

  // In a real app, you would determine if the current user has liked it already.
  // We'll just assume they haven't in this demo state.
  
  // Note: Real-time update for likes is handled at the Feed level in useSocialSocket.
  // But if we want local state update, we just rely on props if it trickles down, or optimistic update here.
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating if wrapped in a link
    e.stopPropagation();

    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để thích bài viết.');
      return;
    }

    // Optimistic update
    setLiked((v) => !v);
    setCount((c) => liked ? c - 1 : c + 1);

    try {
      await socialApi.toggleLike(postId);
    } catch (err) {
      // Revert on error
      setLiked((v) => !v);
      setCount((c) => liked ? c + 1 : c - 1);
      message.error('Có lỗi xảy ra.');
    }
  }

  return (
    <button onClick={handleClick} className="flex items-center gap-1 hover:scale-110 transition-transform">
      <span className={liked ? 'text-pink-500' : 'grayscale'}>❤️</span> 
      <span className="font-medium">{count}</span>
    </button>
  );
}
