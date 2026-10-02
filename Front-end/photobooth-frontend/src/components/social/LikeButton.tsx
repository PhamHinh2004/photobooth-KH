import React, { useState, useEffect } from 'react';
import { socialApi } from '../../api/social.api';
import { useAuthStore } from '../../stores/auth.store';
import { message } from 'antd';

function getLikedPosts(storageKey: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveLikedPosts(storageKey: string, postIds: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(postIds));
  } catch {
    // The server response remains authoritative if local storage is unavailable.
  }
}

export function LikeButton({
  postId,
  initialCount,
  className = '',
}: {
  postId: string;
  initialCount: number;
  className?: string;
}) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const accountId = useAuthStore((state) => state.user?.id);
  const storageKey = `likedPosts:${accountId ?? 'anonymous'}`;

  const [liked, setLiked] = useState(() => {
    return getLikedPosts(storageKey).includes(postId);
  });

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setLiked(getLikedPosts(storageKey).includes(postId));
  }, [postId, storageKey]);

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
    const previousLiked = liked;
    const previousCount = count;
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(Math.max(0, previousCount + (newLiked ? 1 : -1)));

    const previousLikedPosts = getLikedPosts(storageKey);
    const nextLikedPosts = newLiked
      ? [...new Set([...previousLikedPosts, postId])]
      : previousLikedPosts.filter((id) => id !== postId);
    saveLikedPosts(storageKey, nextLikedPosts);

    try {
      const updatedPost = await socialApi.toggleLike(postId);
      if (typeof updatedPost?.likes_count === 'number') setCount(updatedPost.likes_count);
    } catch {
      setLiked(previousLiked);
      setCount(previousCount);
      saveLikedPosts(storageKey, previousLikedPosts);
      message.error('Có lỗi xảy ra.');
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={pending} className={`flex items-center gap-1 hover:scale-110 transition-transform disabled:cursor-wait ${className}`}>
      <span className={liked ? 'text-pink-500' : 'grayscale'}>❤️</span> 
      <span className="font-medium">{count}</span>
    </button>
  );
}
