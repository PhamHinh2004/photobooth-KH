import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import { socialApi } from '../../api/social.api';

interface RepostButtonProps {
  postId: string;
  initialCount: number;
  initialReposted?: boolean;
}

export function RepostButton({ postId, initialCount, initialReposted = false }: RepostButtonProps) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);

  React.useEffect(() => {
    setReposted(initialReposted);
  }, [initialReposted]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setReposted((v) => !v);
    setCount((c) => (reposted ? c - 1 : c + 1));

    try {
      await socialApi.toggleRepost(postId);
    } catch (error) {
      console.error('Failed to toggle repost', error);
      // Revert on error
      setReposted(reposted);
      setCount(initialCount);
    }
  }

  return (
    <button 
      onClick={handleClick} 
      className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded transition-colors ${
        reposted 
          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
          : 'text-zinc-600 bg-zinc-50 hover:bg-zinc-100'
      }`}
    >
      <Repeat2 size={16} /> {count > 0 ? count : ''}
    </button>
  );
}
