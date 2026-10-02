import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { socialApi } from '../../api/social.api';
import { message } from 'antd';
import { Smile, ImagePlay, Send, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { GifPicker } from './GifPicker';

interface CommentInputProps {
  postId?: string;
  parentCommentId?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

const MAX_CHARS = 500;
const QUICK_EMOJIS = ['❤️', '✨', '🔥', '📸', '😍', '👏', '🙌', '💯'];

export function CommentInput({ postId, parentCommentId, compact, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((state) => !!state.token);

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowGif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) { setContent((c) => c + text); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = content.slice(0, start) + text + content.slice(end);
    setContent(newVal);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);

    // Nếu có chọn text thì wrap, không thì chỉ chèn cặp thẻ tại vị trí con trỏ
    const newVal = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newVal);

    requestAnimationFrame(() => {
      if (selected) {
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
      } else {
        ta.selectionStart = ta.selectionEnd = start + before.length;
      }
      ta.focus();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = gifUrl
      ? (content.trim() ? content.trim() + '\n[gif]' + gifUrl + '[/gif]' : '[gif]' + gifUrl + '[/gif]')
      : content.trim();
    if (!finalContent) return;
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để bình luận.');
      return;
    }
    try {
      setSubmitting(true);
      await socialApi.createComment({
        post_id: postId!,
        parent_comment_id: parentCommentId,
        content: finalContent,
      });
      setContent('');
      setGifUrl(null);
      onSuccess?.();
    } catch {
      message.error('Gửi bình luận thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  if (compact) {
    // Compact inline reply mode
    return (
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
        {/* GIF Preview in compact mode */}
        {gifUrl && (
          <div className="relative rounded-xl overflow-hidden border border-zinc-200 max-w-[120px]">
            <img src={gifUrl} alt="GIF" className="rounded-xl max-h-20 object-cover" />
            <button
              type="button"
              onClick={() => setGifUrl(null)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 relative" ref={toolbarRef}>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Viết câu trả lời..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-16 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 resize-none h-10 transition-all"
                disabled={submitting}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setShowGif((v) => !v); setShowEmoji(false); }}
                  className="text-zinc-400 hover:text-purple-500 transition-colors"
                >
                  <ImagePlay size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEmoji((v) => !v); setShowGif(false); }}
                  className="text-zinc-400 hover:text-yellow-500 transition-colors"
                >
                  <Smile size={16} />
                </button>
              </div>

              {showEmoji && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker onSelect={(emoji) => { insertAtCursor(emoji); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />
                </div>
              )}
              {showGif && (
                <div className="absolute bottom-full right-0 mb-2">
                  <GifPicker onSelect={(url) => { setGifUrl(url); setShowGif(false); }} onClose={() => setShowGif(false)} />
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || (!content.trim() && !gifUrl)}
            className="h-10 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow hover:shadow-md disabled:opacity-40 disabled:shadow-none flex items-center gap-1"
          >
            <Send size={13} /> Gửi
          </button>
        </div>

        {/* Quick emojis for better UX */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertAtCursor(emoji)}
              className="text-sm w-7 h-7 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </form>
    );
  }

  return (
    <div className={`mb-6 ${focused ? 'ring-1 ring-pink-300 rounded-2xl' : ''} transition-all`}>
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Quick emojis at top */}
        <div className="px-4 py-2 bg-zinc-50/50 border-b border-zinc-100 flex gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-zinc-400 uppercase self-center mr-1">Nhanh:</span>
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertAtCursor(emoji)}
              className="text-lg w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all transform hover:scale-110 active:scale-95 shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* GIF Preview */}
        {gifUrl && (
          <div className="relative m-3 mb-0 rounded-xl overflow-hidden border border-zinc-200 max-w-[200px]">
            <img src={gifUrl} alt="GIF" className="rounded-xl max-h-28 object-cover" />
            <button
              type="button"
              onClick={() => setGifUrl(null)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Chia sẻ cảm nghĩ của bạn... (Ctrl+Enter để gửi)"
          className="w-full px-4 pt-3 pb-2 text-sm text-zinc-800 placeholder-zinc-400 bg-transparent focus:outline-none resize-none h-24"
          disabled={submitting}
        />

        {/* Toolbar */}
        <div ref={toolbarRef} className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-100">
          {/* Left: formatting tools */}
          <div className="flex items-center gap-1 relative">
            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowEmoji((v) => !v); setShowGif(false); }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  showEmoji ? 'bg-yellow-100 text-yellow-600' : 'text-zinc-500 hover:bg-zinc-100 hover:text-yellow-500'
                }`}
                title="Chèn emoji"
              >
                <Smile size={15} />
                <span className="hidden sm:inline">Emoji</span>
              </button>
              {showEmoji && (
                <EmojiPicker onSelect={(emoji) => insertAtCursor(emoji)} onClose={() => setShowEmoji(false)} />
              )}
            </div>

            {/* GIF Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowGif((v) => !v); setShowEmoji(false); }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  showGif ? 'bg-purple-100 text-purple-600' : 'text-zinc-500 hover:bg-zinc-100 hover:text-purple-500'
                }`}
                title="Chèn GIF"
              >
                <ImagePlay size={15} />
                <span className="hidden sm:inline">GIF</span>
              </button>
              {showGif && (
                <GifPicker onSelect={(url) => { setGifUrl(url); }} onClose={() => setShowGif(false)} />
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-zinc-200 mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => wrapSelection('**', '**')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors font-bold text-lg"
              title="In đậm"
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => wrapSelection('_', '_')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors italic text-lg"
              title="In nghiêng"
            >
              I
            </button>
          </div>

          {/* Right: char counter + submit */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-medium tabular-nums ${isOverLimit ? 'text-red-500' : charsLeft < 50 ? 'text-amber-500' : 'text-zinc-300'}`}>
              {charsLeft}
            </span>
            <button
              type="submit"
              disabled={submitting || (!content.trim() && !gifUrl) || isOverLimit}
              className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-[13px] font-bold rounded-xl px-4 py-1.5 transition-all shadow hover:shadow-md disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? (
                <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang gửi</span>
              ) : (
                <><Send size={13} /> Gửi</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
