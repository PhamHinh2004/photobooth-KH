import React, { useState } from 'react';
import { CommentInput } from './CommentInput';

export interface CommentNode {
  id: string;
  post_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  account: { full_name: string; avatar_url?: string; role?: string };
  replies: CommentNode[];
}

export function CommentThread({ comment, depth = 0 }: { comment: CommentNode; depth?: number }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expanded, setExpanded] = useState(depth < 1); // Expand first level by default

  const formatRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    const diff = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60));
    if (diff > -24) return rtf.format(diff, 'hour');
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className={depth > 0 ? 'ml-10 mt-3' : 'mt-5'}>
      <div className="flex gap-3">
        <img 
          src={comment.account?.avatar_url || 'https://ui-avatars.com/api/?name=' + (comment.account?.full_name || 'U')} 
          className="w-8 h-8 rounded-full border border-zinc-200" 
          alt="" 
        />
        <div className="flex-1">
          <div className="bg-zinc-50 rounded-2xl px-4 py-2 border border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-800">{comment.account?.full_name || 'Người dùng'}</span>
              {comment.account?.role === 'admin' && (
                <span className="text-[10px] font-medium bg-pink-500 text-white px-2 py-0.5 rounded-full">
                  KH BOOTH Official Support
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 px-2 font-medium">
            <span>{formatRelativeTime(comment.created_at)}</span>
            <button className="hover:text-pink-500 transition-colors">❤️ {comment.likes_count}</button>
            <button onClick={() => setShowReplyBox((v) => !v)} className="hover:text-pink-500 transition-colors">Trả lời</button>
          </div>

          {showReplyBox && (
            <CommentInput 
              postId={comment.post_id} 
              parentCommentId={comment.id} 
              compact 
              onSuccess={() => setShowReplyBox(false)} 
            />
          )}

          {comment.replies?.length > 0 && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-xs font-semibold text-pink-500 hover:text-pink-600 mt-2 ml-2 transition-colors">
              Xem thêm {comment.replies.length} câu trả lời
            </button>
          )}

          {expanded && comment.replies?.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
