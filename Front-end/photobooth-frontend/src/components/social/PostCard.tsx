import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LikeButton } from './LikeButton';

interface PostCardProps {
  post: {
    id: string;
    cover_image_url: string;
    caption: string;
    likes_count: number;
    comments_count: number;
    style_tags?: string[];
    created_at: string;
    account: { full_name: string; avatar_url?: string };
    session?: { frame_id?: string };
  };
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();

  const handleApplyFrame = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.session?.frame_id) {
      navigate(`/capture/step1`);
    } else {
      navigate(`/capture/step1`);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference === 0) return 'Hôm nay';
    if (daysDifference > -30) return rtf.format(daysDifference, 'day');
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/reviews/${post.id}`} className="block relative aspect-[3/4] overflow-hidden group">
        <img 
          src={post.cover_image_url || 'https://via.placeholder.com/300x400'} 
          alt={post.caption} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur text-pink-600 font-medium px-4 py-2 rounded-full text-sm">
            Xem chi tiết
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={post.account?.avatar_url || 'https://ui-avatars.com/api/?name=' + (post.account?.full_name || 'User')}
            className="w-8 h-8 rounded-full border border-zinc-200"
            alt={post.account?.full_name}
          />
          <span className="text-sm font-semibold text-zinc-800 line-clamp-1">{post.account?.full_name || 'Người dùng'}</span>
          <span className="text-[11px] text-zinc-400 ml-auto whitespace-nowrap">{formatRelativeTime(post.created_at)}</span>
        </div>

        <p className="text-sm text-zinc-600 line-clamp-2 mb-3 flex-1">{post.caption}</p>

        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
          <LikeButton postId={post.id} initialCount={post.likes_count} />
          <Link to={`/reviews/${post.id}`} className="flex items-center gap-1 hover:text-pink-500 transition-colors">
            💬 <span className="font-medium">{post.comments_count}</span>
          </Link>
        </div>

        <button
          onClick={handleApplyFrame}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          Áp Dụng Khung Này
        </button>
      </div>
    </div>
  );
}
