import React, { useState, useEffect } from 'react';
import { socialApi } from '../../api/social.api';
import { useAuthStore } from '../../stores/auth.store';
import { message } from 'antd';

export function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const isAuthenticated = useAuthStore((state) => !!state.token);

  // Initialize liked state from localStorage
  const [liked, setLiked] = useState(() => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    return likedPosts.includes(postId);
  });

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating if wrapped in a link
    e.stopPropagation();
    if (pending) return;

    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để thích bài viết.');
      return;
    }

    // Optimistic update
    setPending(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => newLiked ? c + 1 : c - 1);

    // Update local storage
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    if (newLiked) {
      localStorage.setItem('likedPosts', JSON.stringify([...likedPosts, postId]));
    } else {
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts.filter((id: string) => id !== postId)));
    }

    try {
      await socialApi.toggleLike(postId);
    } catch (err) {
      // Revert on error
      setLiked(liked);
      setCount((c) => liked ? c + 1 : c - 1);
      
      // Revert local storage
      if (liked) {
        localStorage.setItem('likedPosts', JSON.stringify([...likedPosts, postId]));
      } else {
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts.filter((id: string) => id !== postId)));
      }
      
      message.error('Có lỗi xảy ra.');
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={pending} className="flex items-center gap-1 hover:scale-110 transition-transform disabled:cursor-wait">
      <span className={liked ? 'text-pink-500' : 'grayscale'}>❤️</span> 
      <span className="font-medium">{count}</span>
    </button>
  );
}
