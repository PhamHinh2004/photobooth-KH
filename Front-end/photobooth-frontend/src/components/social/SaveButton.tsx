import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { socialApi } from '../../api/social.api';

interface SaveButtonProps {
  postId: string;
  initialSaved?: boolean;
}

export function SaveButton({ postId, initialSaved = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  React.useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setSaved((v) => !v);

    try {
      await socialApi.toggleSave(postId);
    } catch (error) {
      console.error('Failed to toggle save', error);
      // Revert on error
      setSaved(saved);
    }
  }

  return (
    <button 
      onClick={handleClick} 
      className={`p-1.5 rounded transition-colors ${
        saved 
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
          : 'text-zinc-400 bg-zinc-50 hover:text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
