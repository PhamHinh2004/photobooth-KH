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
type TextFormat = 'bold' | 'italic';

interface FormatRange {
  start: number;
  end: number;
  format: TextFormat;
}

export function CommentInput({ postId, parentCommentId, compact, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [formats, setFormats] = useState<FormatRange[]>([]);
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

  const mapFormatsAfterEdit = (ranges: FormatRange[], start: number, end: number, insertedLength: number) => {
    const delta = insertedLength - (end - start);

    return ranges.flatMap((range) => {
      if (start === end && range.start < start && range.end > start) {
        return [{ ...range, end: range.end + insertedLength }];
      }
      if (range.end <= start) return [range];
      if (range.start >= end) {
        return [{ ...range, start: range.start + delta, end: range.end + delta }];
      }
      if (range.start <= start && range.end >= end) {
        return [{ ...range, end: range.end + delta }];
      }

      const updated: FormatRange[] = [];
      if (range.start < start) updated.push({ ...range, end: start });
      if (range.end > end) {
        updated.push({ ...range, start: start + insertedLength, end: range.end + delta });
      }
      return updated;
    }).filter((range) => range.end > range.start);
  };

  const handleContentChange = (value: string) => {
    const nextValue = value.slice(0, MAX_CHARS);
    let start = 0;
    while (start < content.length && start < nextValue.length && content[start] === nextValue[start]) start++;

    let oldEnd = content.length;
    let newEnd = nextValue.length;
    while (oldEnd > start && newEnd > start && content[oldEnd - 1] === nextValue[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    setFormats((current) => mapFormatsAfterEdit(current, start, oldEnd, newEnd - start));
    setContent(nextValue);
  };

  const replaceContentRange = (start: number, end: number, text: string) => {
    const nextValue = content.slice(0, start) + text + content.slice(end);
    setFormats((current) => mapFormatsAfterEdit(current, start, end, text.length));
    setContent(nextValue);
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      replaceContentRange(content.length, content.length, text);
      return;
    }

    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? start;

    replaceContentRange(start, end, text);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  };

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? start;
    if (start === end) return;

    const format: TextFormat = before === '**' && after === '**' ? 'bold' : 'italic';
    const selectedRanges = formats.filter((range) => range.format === format && range.start <= start && range.end >= end);

    if (selectedRanges.length > 0) {
      setFormats((current) => current.flatMap((range) => {
        if (range.format !== format || range.end <= start || range.start >= end) return [range];
        const remaining: FormatRange[] = [];
        if (range.start < start) remaining.push({ ...range, end: start });
        if (range.end > end) remaining.push({ ...range, start: end });
        return remaining;
      }));
    } else {
      setFormats((current) => [...current, { start, end, format }]);
    }

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, end);
    });
  };

  const toMarkdown = (text: string, ranges: FormatRange[]) => {
    const marker = (format: TextFormat) => format === 'bold' ? '**' : '_';
    const orderedRanges = [...ranges].sort((left, right) => {
      if (left.format !== right.format) return left.format === 'bold' ? -1 : 1;
      return left.start - right.start || right.end - left.end;
    });
    let result = '';
    let active: TextFormat[] = [];

    for (let index = 0; index <= text.length; index++) {
      const nextActive = (['bold', 'italic'] as TextFormat[]).filter((format) =>
        orderedRanges.some((range) => range.format === format && range.start <= index && range.end > index),
      );
      let shared = 0;
      while (shared < active.length && shared < nextActive.length && active[shared] === nextActive[shared]) shared++;
      for (let closeIndex = active.length - 1; closeIndex >= shared; closeIndex--) result += marker(active[closeIndex]);
      for (let openIndex = shared; openIndex < nextActive.length; openIndex++) result += marker(nextActive[openIndex]);
      active = nextActive;
      if (index < text.length) result += text[index];
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedContent = toMarkdown(content, formats).trim();
    const finalContent = gifUrl
      ? (formattedContent ? formattedContent + '\n[gif]' + gifUrl + '[/gif]' : '[gif]' + gifUrl + '[/gif]')
      : formattedContent;
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
      setFormats([]);
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
      return;
    }

    if ((e.ctrlKey || e.metaKey) && ['b', 'i'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      wrapSelection(e.key.toLowerCase() === 'b' ? '**' : '_', e.key.toLowerCase() === 'b' ? '**' : '_');
    }
  };

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  const renderRichPreview = (text: string) => {
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const formatted = escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>')
      .replace(/__(.+?)__/g, '<strong class="font-bold text-zinc-900">$1</strong>')
      .replace(/_(.+?)_/g, '<em class="italic text-zinc-800">$1</em>')
      .replace(/@([A-Za-z0-9_]+)/g, '<span class="text-blue-500 font-semibold">@$1</span>');

    return formatted
      .replace(/\[gif\]([^\]]+)\[\/gif\]/gi, '<div class="mt-2 rounded-xl overflow-hidden border border-zinc-200 max-w-[220px]"><img src="$1" alt="GIF" class="w-full max-h-32 object-cover rounded-xl" /></div>')
      .replace(/\n/g, '<br />');
  };

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
                onChange={(e) => handleContentChange(e.target.value)}
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
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-visible">
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

        <div className="relative px-4 pt-3 pb-2 min-h-[96px]">
          {!content.trim() && (
            <div className="pointer-events-none absolute inset-x-4 top-3 text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
              Chia sẻ cảm nghĩ của bạn... (Ctrl+Enter để gửi)
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-4 top-3 bottom-2 whitespace-pre-wrap break-words leading-relaxed text-sm text-zinc-800"
            dangerouslySetInnerHTML={{ __html: content.trim() ? renderRichPreview(toMarkdown(content, formats)) : '' }}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=""
            className="relative z-10 w-full min-h-[96px] bg-transparent text-sm resize-none focus:outline-none caret-zinc-800"
            style={{ color: 'transparent', WebkitTextFillColor: 'transparent', textShadow: '0 0 0 transparent' }}
            disabled={submitting}
          />
        </div>

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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapSelection('**', '**')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors font-bold text-lg"
              title="In đậm"
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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