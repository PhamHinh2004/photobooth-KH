import React from 'react';
import { DiscussionSection } from './DiscussionSection';
import { LikeButton } from './LikeButton';
import { useNavigate } from 'react-router-dom';

interface PostDetailLayoutProps {
  post: any;
}

const formatRelativeTime = (dateString: string) => {
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const diff = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hôm nay';
  if (diff > -30) return rtf.format(diff, 'day');
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export function PostDetailLayout({ post }: PostDetailLayoutProps) {
  const navigate = useNavigate();

  const handleApplyFrame = () => {
    if (post.session?.photo?.frame) {
      navigate('/capture', { state: { initialFrame: post.session.photo.frame } });
    } else {
      navigate('/capture');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 max-w-6xl mx-auto px-4 py-8">
      {/* Cột trái: Ảnh và CTA */}
      <div className="flex flex-col">
        <div className="rounded-xl overflow-hidden bg-white border border-zinc-100 shadow-sm relative aspect-[3/4]">
          <img
            src={post.cover_image_url || 'https://via.placeholder.com/600x800'}
            className="w-full h-full object-contain bg-zinc-50"
            alt={post.caption}
          />
        </div>
        <button
          onClick={handleApplyFrame}
          className="mt-6 w-full py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
        >
          Áp Dụng Khung Này Ngay
        </button>
        <div className="flex gap-3 mt-4">
          <button onClick={copyLink} className="flex-1 py-2.5 rounded-full border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
            🔗 Copy link
          </button>
          <button className="flex-1 py-2.5 rounded-full border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
            📤 Chia sẻ
          </button>
        </div>
      </div>

      {/* Cột phải: Content và Comment */}
      <div className="flex flex-col bg-white rounded-2xl p-6 md:p-8 border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={post.account?.avatar_url || 'https://ui-avatars.com/api/?name=' + (post.account?.username || 'U')}
            className="w-12 h-12 rounded-full border-2 border-pink-100"
            alt={post.account?.username}
          />
          <div>
            <h2 className="text-lg font-bold text-zinc-800">{post.account?.username || 'Người dùng'}</h2>
            <div className="text-sm text-zinc-500 flex items-center gap-2">
              <span>{formatRelativeTime(post.created_at)}</span>
              {/* Optional Rating Display */}
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>

        <p className="text-zinc-700 whitespace-pre-line text-base leading-relaxed mb-6">{post.caption}</p>

        <div className="flex items-center gap-6 text-zinc-600 py-4 border-y border-zinc-100 mb-2">
          <div className="flex items-center gap-2 scale-110 origin-left">
            <LikeButton postId={post.id} initialCount={post.likes_count} />
          </div>
          <div className="flex items-center gap-2">
            💬 <span className="font-medium">{post.comments_count}</span>
          </div>
        </div>

        <DiscussionSection postId={post.id} />
      </div>
    </div>
  );
}
