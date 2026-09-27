import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { socialApi } from '../../api/social.api';
import { message } from 'antd';

interface CommentInputProps {
  postId?: string;
  parentCommentId?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

export function CommentInput({ postId, parentCommentId, compact, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAuthenticated = useAuthStore((state) => !!state.token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để bình luận.');
      return;
    }

    try {
      setSubmitting(true);
      // We assume postId is available if it's a root comment,
      // or we just send parentCommentId and API handles it if modified. 
      // Actually our API needs post_id in CreateCommentDto.
      // We might need to pass postId down to replies too.
      await socialApi.createComment({
        post_id: postId!, 
        parent_comment_id: parentCommentId,
        content: content.trim(),
      });
      setContent('');
      onSuccess?.();
    } catch (error) {
      message.error('Gửi bình luận thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? 'mt-3' : 'mb-6'}`}>
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={compact ? "Viết câu trả lời..." : "Chia sẻ cảm nghĩ của bạn..."}
          className={`w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 resize-none transition-shadow ${compact ? 'h-10 py-2' : 'h-24'}`}
          disabled={submitting}
        />
      </div>
      <button 
        type="submit" 
        disabled={submitting || !content.trim()}
        className={`bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-xl px-6 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none ${compact ? 'h-10' : 'h-12 self-end'}`}
      >
        Gửi
      </button>
    </form>
  );
}
