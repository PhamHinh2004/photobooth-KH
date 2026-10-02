import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle } from 'lucide-react';
import { LikeButton } from './LikeButton';
import { socialApi } from '../../api/social.api';
import { CommentInput } from './CommentInput';
import { CommentThread } from './CommentThread';
import { buildCommentTree } from './commentTree';

interface PostCardProps {
  post: {
    id: string;
    cover_image_url: string;
    caption: string;
    likes_count: number;
    comments_count: number;
    views_count?: number;
    style_tags?: string[];
    created_at: string;
    account: { 
      id?: string;
      username?: string; 
      full_name?: string;
      avatarUrl?: string | null;
      avatar_url?: string | null;
      customer?: {
        fullName?: string | null;
        full_name?: string | null;
        image?: string | null;
      } | null;
    };
    session?: { 
      session_type?: string; 
      photo?: { 
        frame?: { 
          id: string;
          name: string;
        } 
      } 
    };
  };
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  account?: {
    id?: string;
    username?: string;
    full_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    customer?: { fullName?: string | null; full_name?: string | null; image?: string | null } | null;
  } | null;
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [applying, setApplying] = useState(false);

  const handleApplyFrame = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (applying) return;
    
    setApplying(true);
    try {
      const fullPost = await socialApi.getPost(post.id);
      const frame = fullPost?.session?.photo?.frame;
      
      if (frame?.id) {
        navigate(`/capture`, { state: { initialFrameId: frame.id, initialFrame: frame } });
      } else {
        navigate(`/capture`);
      }
    } catch (error) {
      console.error('Failed to load post details', error);
      navigate(`/capture`);
    } finally {
      setApplying(false);
    }
  };

  // Fetch comments when dropdown opens
  useEffect(() => {
    if (!showComments) return;
    let cancelled = false;
    async function load() {
      setLoadingComments(true);
      try {
        const data = await socialApi.getComments(post.id);
        if (!cancelled) setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [showComments, post.id]);

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    const dateJustDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowJustDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.round((nowJustDay.getTime() - dateJustDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      if (diffMinutes < 1) return 'mới';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} giờ trước`;
    }
    
    return `${diffDays} ngày trước`;
  };

  const fullName = post.account?.customer?.fullName || post.account?.customer?.full_name || post.account?.full_name || post.account?.username || 'Người dùng ẩn danh';
  const avatarUrl = post.account?.customer?.image || post.account?.avatarUrl || post.account?.avatar_url;
  const frameName = post.session?.photo?.frame?.name;
  const commentTree = buildCommentTree(comments);

  const reloadComments = async () => {
    const data = await socialApi.getComments(post.id);
    setComments(Array.isArray(data) ? data : []);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all flex flex-col font-sans">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
          </div>
        </div>
        <span className="text-[12px] font-medium text-blue-500">{formatRelativeTime(post.created_at)}</span>
      </div>

      {/* User Info & Frame Name */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover shadow-inner" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {frameName && (
                <div className="font-bold text-[15px] text-zinc-800">
                  {frameName}
                </div>
              )}
              <div className={`text-zinc-500 font-medium ${frameName ? 'text-[12px]' : 'font-bold text-[15px] text-zinc-800'}`}>
                {fullName}
              </div>
            </div>
          </div>
          {post.session?.session_type && (
            <span className="bg-pink-100 text-pink-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
              {post.session.session_type === 'group' ? 'Chụp Nhóm' : 'Chụp Đơn'}
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      <Link to={`/reviews/${post.id}`} className="block relative aspect-[4/5] overflow-hidden group bg-zinc-100 mx-4 rounded-xl">
        <img 
          src={post.cover_image_url || 'https://via.placeholder.com/400x500'} 
          alt={post.caption || 'Hình ảnh từ KH BOOTH'} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col">
        <p className="text-[14px] text-zinc-800 font-medium line-clamp-2 mb-4 leading-relaxed mt-2">
          {post.caption || ''}
        </p>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <div className="flex gap-2">
            <LikeButton postId={post.id} initialCount={post.likes_count ?? 0} />
            <button className="flex items-center gap-1 text-[12px] font-bold text-zinc-600 bg-zinc-50 px-2 py-1 rounded hover:bg-zinc-100">
              <span>👁️</span> {post.views_count ?? 0}
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowComments(!showComments); }}
              className={`flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded transition-colors ${showComments ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              <MessageCircle size={14} /> {post.comments_count ?? 0} Bình luận
            </button>
            <button className="text-zinc-400 hover:text-zinc-600 bg-zinc-50 p-1.5 rounded">
              <Bookmark size={16} />
            </button>
          </div>
        </div>
        
        {/* Comments Dropdown */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            {loadingComments ? (
              <div className="text-[13px] text-zinc-400 text-center py-3">Đang tải bình luận...</div>
            ) : comments.length === 0 ? (
              <div className="text-[13px] text-zinc-500 text-center py-2 italic bg-zinc-50 rounded-lg">
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            ) : (
              <div className="space-y-3">
                {commentTree.slice(0, 2).map((comment) => (
                  <CommentThread key={comment.id} comment={comment} onReplySuccess={reloadComments} />
                ))}
                {commentTree.length > 2 && (
                  <Link 
                    to={`/reviews/${post.id}`} 
                    className="block text-center text-blue-500 text-[13px] hover:underline py-2 bg-blue-50/50 rounded-lg transition-colors hover:bg-blue-50"
                  >
                    Xem tất cả {post.comments_count} bình luận
                  </Link>
                )}
              </div>
            )}
            <div className="mt-3">
              <CommentInput postId={post.id} compact onSuccess={reloadComments} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleApplyFrame}
          disabled={applying}
          className="w-full mt-4 py-3 rounded-xl bg-[#0f627a] hover:bg-[#0c4e62] disabled:opacity-70 disabled:cursor-wait text-white text-[14px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {applying ? 'Đang Xử Lý...' : 'Áp Dụng Frame Này Ngay'}
          {!applying && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
