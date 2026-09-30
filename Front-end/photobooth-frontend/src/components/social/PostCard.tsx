import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle } from 'lucide-react';

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
    account: { username?: string; avatar_url?: string };
    session?: { session_type?: string, photo?: { frame?: { id: string } } };
  };
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);

  const handleApplyFrame = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/capture/step1`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full font-sans">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
          </div>
        </div>
        <span className="text-[12px] font-medium text-blue-500">{formatDate(post.created_at)}</span>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {post.account?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-[15px] text-zinc-800 flex items-center gap-1">
                {post.account?.username || 'Người dùng ẩn danh'}
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
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[14px] text-zinc-800 font-medium line-clamp-2 mb-4 leading-relaxed mt-2">
          {post.caption || ''}
        </p>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-[12px] font-bold text-zinc-600 bg-zinc-50 px-2 py-1 rounded hover:bg-zinc-100">
              <span className="text-red-500">❤️</span> {post.likes_count ?? 0}
            </button>
            <button className="flex items-center gap-1 text-[12px] font-bold text-zinc-600 bg-zinc-50 px-2 py-1 rounded hover:bg-zinc-100">
              <span>👁️</span> {post.views_count ?? 0}
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); setShowComments(!showComments); }}
              className="flex items-center gap-1 text-[12px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
            >
              <MessageCircle size={14} /> {post.comments_count ?? 0} Bình luận
            </button>
            <button className="text-zinc-400 hover:text-zinc-600 bg-zinc-50 p-1.5 rounded">
              <Bookmark size={16} />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyFrame}
          className="w-full mt-4 py-3 rounded-xl bg-[#0f627a] hover:bg-[#0c4e62] text-white text-[14px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Áp Dụng Frame Này Ngay
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
