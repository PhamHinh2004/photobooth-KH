import React, { useState } from 'react';
import { CommentInput } from './CommentInput';
import type { CommentNode } from './commentTree';
import { Heart, MessageSquare, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';

export type { CommentNode } from './commentTree';

// Quick reactions with names for better accessibility/internal tracking if needed
const REACTIONS = [
  { emoji: '❤️', label: 'Yêu thích' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Ngạc nhiên' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '😡', label: 'Phẫn nộ' },
  { emoji: '👍', label: 'Thích' },
  { emoji: '🔥', label: 'Hot' },
  { emoji: '🎉', label: 'Chúc mừng' },
];

/** Render comment text – supports [gif]url[/gif] syntax */
function CommentBody({ content }: { content: string }) {
  // Split by [gif]...[/gif] tags
  const parts = content.split(/(\[gif\].*?\[\/gif\])/g);
  return (
    <div className="text-sm text-zinc-700 mt-1 whitespace-pre-wrap leading-relaxed break-words">
      {parts.map((part, i) => {
        const gifMatch = part.match(/^\[gif\](.*?)\[\/gif\]$/);
        if (gifMatch) {
          return (
            <div key={i} className="mt-2 rounded-xl overflow-hidden max-w-[280px] border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group/gif relative">
              <img
                src={gifMatch[1]}
                alt="GIF"
                className="w-full rounded-xl object-cover max-h-48"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/gif:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        }
        // Render **bold** and _italic_ inline
        const rendered = part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>')
          .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
          .replace(/@(\w+)/g, '<span class="text-blue-500 font-semibold cursor-pointer hover:underline">@$1</span>');
        return <span key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
      })}
    </div>
  );
}

export function CommentThread({
  comment,
  depth = 0,
  onReplySuccess,
}: {
  comment: CommentNode;
  depth?: number;
  onReplySuccess?: () => void;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expanded, setExpanded] = useState(depth < 1);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes_count ?? 0);
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const fullName =
    comment.account?.customer?.fullName ||
    comment.account?.customer?.full_name ||
    comment.account?.full_name ||
    comment.account?.username ||
    'Người dùng';
  const avatarUrl =
    comment.account?.customer?.image ||
    comment.account?.avatarUrl ||
    comment.account?.avatar_url;

  const formatRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    const diff = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60));
    if (diff > -24) return rtf.format(diff, 'hour');
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      setReaction(null);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setReaction('❤️');
    }
    setShowReactions(false);
  };

  const handleReaction = (emoji: string) => {
    setReaction(emoji);
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    setShowReactions(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-5'}`}>
      <div className="flex gap-3 group">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
              alt={fullName}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-zinc-50 rounded-2xl px-4 py-2.5 border border-zinc-100 inline-block max-w-full relative">
            {/* Name + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-zinc-800">{fullName}</span>
              {comment.account?.role === 'admin' && (
                <span className="text-[10px] font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                  ✨ KH BOOTH Official
                </span>
              )}
            </div>
            <CommentBody content={comment.content} />

            {/* Reaction bubble (if reacted) */}
            {reaction && (
              <div className="absolute -bottom-2.5 right-3 bg-white border border-zinc-200 rounded-full px-1.5 py-0.5 text-sm shadow-sm">
                {reaction}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400 px-1 font-medium select-none">
            <span className="text-zinc-400">{formatRelativeTime(comment.created_at)}</span>

            {/* Like with long-press reaction */}
            <div className="relative">
              <button
                onClick={handleLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setTimeout(() => setShowReactions(false), 500)}
                className={`flex items-center gap-1 hover:text-pink-500 transition-all font-semibold ${liked ? 'text-pink-500' : 'text-zinc-400'}`}
              >
                {reaction ? (
                  <span className="text-base leading-none">{reaction}</span>
                ) : (
                  <Heart size={13} className={liked ? 'fill-pink-500' : ''} />
                )}
                <span>{likeCount > 0 ? likeCount : ''}</span>
              </button>

              {/* Reaction Picker (hover) */}
              {showReactions && (
                <div
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                  className="absolute bottom-full left-0 mb-1.5 bg-white border border-zinc-200 rounded-2xl px-2 py-1.5 shadow-xl flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => handleReaction(r.emoji)}
                      className="text-xl w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 hover:scale-125 transform transition-transform duration-100"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className={`flex items-center gap-1 hover:text-blue-500 transition-colors font-semibold ${showReplyBox ? 'text-blue-500' : ''}`}
            >
              <MessageSquare size={13} />
              Trả lời
            </button>

            {/* Options */}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <button
                onClick={() => setShowOptions((v) => !v)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400"
              >
                <MoreHorizontal size={14} />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 min-w-[120px] overflow-hidden">
                  <button className="w-full text-left px-3 py-2 text-[12px] text-zinc-600 hover:bg-zinc-50 font-medium">
                    📋 Sao chép
                  </button>
                  <button className="w-full text-left px-3 py-2 text-[12px] text-zinc-600 hover:bg-zinc-50 font-medium">
                    🚩 Báo cáo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reply box */}
          {showReplyBox && (
            <CommentInput
              postId={comment.post_id}
              parentCommentId={comment.id}
              compact
              onSuccess={() => {
                setShowReplyBox(false);
                onReplySuccess?.();
              }}
            />
          )}

          {/* Collapse/expand replies */}
          {comment.replies?.length > 0 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 mt-2 ml-1 transition-colors"
            >
              <ChevronDown size={13} />
              Xem {comment.replies.length} câu trả lời
            </button>
          )}

          {expanded && comment.replies?.length > 0 && (
            <>
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onReplySuccess={onReplySuccess}
                />
              ))}
              {depth === 0 && (
                <button
                  onClick={() => setExpanded(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600 mt-2 ml-1 transition-colors"
                >
                  <ChevronUp size={13} />
                  Ẩn bớt
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
