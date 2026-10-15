import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { message } from 'antd';
import { socialApi } from '../../api/social.api';
import { useSocialStore } from '../../stores/social.store';

interface SaveButtonProps {
  postId: string;
  initialSaved?: boolean;
  initialCount?: number;
  onSavedChange?: (saved: boolean) => void;
}

export function SaveButton({ postId, initialSaved = false, initialCount = 0, onSavedChange }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  React.useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    const newSaved = !saved;
    const previousCount = count;
    setSaving(true);
    // Optimistic update
    setSaved(newSaved);
    setCount((c) => (newSaved ? c + 1 : Math.max(0, c - 1)));
    onSavedChange?.(newSaved);

    // Update store
    const store = useSocialStore.getState();
    if (newSaved) {
      useSocialStore.setState({ savedPostIds: [...new Set([...store.savedPostIds, postId])] });
    } else {
      useSocialStore.setState({ savedPostIds: store.savedPostIds.filter(id => id !== postId) });
    }

    try {
      await socialApi.toggleSave(postId);
      message.success(newSaved ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.');
    } catch (error) {
      console.error('Failed to toggle save', error);
      // Revert on error
      setSaved(saved);
      setCount(previousCount);
      onSavedChange?.(saved);
      // Revert store
      if (newSaved) {
        useSocialStore.setState({ savedPostIds: useSocialStore.getState().savedPostIds.filter(id => id !== postId) });
      } else {
        useSocialStore.setState({ savedPostIds: [...new Set([...useSocialStore.getState().savedPostIds, postId])] });
      }
      message.error(newSaved ? 'Không thể lưu bài viết.' : 'Không thể bỏ lưu bài viết.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <button 
      onClick={handleClick} 
      disabled={saving}
      aria-label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
      className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1.5 rounded transition-all duration-200 ${
        saved 
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
          : 'text-zinc-400 bg-zinc-50 hover:text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

