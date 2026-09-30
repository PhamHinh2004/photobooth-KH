import React from 'react';
import { DiscussionSection } from './DiscussionSection';
import { LikeButton } from './LikeButton';
import { useNavigate } from 'react-router-dom';
import { Download, Bookmark, Share2, Maximize2, Users, ArrowLeft, Star, Heart, CheckCircle2, MessageCircle } from 'lucide-react';

interface PostDetailLayoutProps {
  post: any;
}

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export function PostDetailLayout({ post }: PostDetailLayoutProps) {
  const navigate = useNavigate();

  const handleApplyFrame = () => {
    navigate('/capture');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 max-w-[1200px] mx-auto px-4 py-6 font-sans">
      {/* Left Column: Image and Actions */}
      <div className="flex flex-col gap-4">
        {/* Top Breadcrumb & Tags */}
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => navigate('/reviews')} 
            className="flex items-center gap-2 text-[14px] font-bold text-zinc-600 bg-white border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-50"
          >
            <ArrowLeft size={16} /> Quay lại Cộng Đồng Đánh Giá
          </button>
          <div className="flex items-center gap-2">
            {post.session?.session_type && (
              <span className="bg-pink-100 text-pink-600 text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Users size={14} /> {post.session.session_type === 'group' ? 'Chụp Nhóm' : 'Chụp Đơn'}
              </span>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div className="rounded-2xl bg-zinc-100/50 border border-zinc-200 overflow-hidden flex flex-col p-2">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
              </div>
            </div>
          </div>
          
          <div className="relative rounded-xl overflow-hidden bg-white mx-2 mb-2">
            <img
              src={post.cover_image_url || 'https://via.placeholder.com/600x800'}
              className="w-full h-auto object-contain"
              alt={post.caption || 'Hình ảnh từ KH BOOTH'}
            />
          </div>
        </div>

        <button
          onClick={handleApplyFrame}
          className="w-full py-4 rounded-xl bg-[#0f627a] hover:bg-[#0c4e62] text-white font-bold text-[16px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
        >
          🚀 Áp Dụng Frame Này Ngay
        </button>

        <div className="grid grid-cols-3 gap-3 mt-2">
          <button className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700">
            <Download size={20} className="text-zinc-400" />
            <span className="text-[12px] font-bold">Tải HD (PNG)</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 py-3 bg-pink-50 rounded-xl border border-pink-100 hover:bg-pink-100 text-pink-600">
            <Bookmark size={20} className="fill-current" />
            <span className="text-[12px] font-bold">Lưu</span>
          </button>
          <button onClick={copyLink} className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700">
            <Share2 size={20} className="text-zinc-400" />
            <span className="text-[12px] font-bold">Chia Sẻ</span>
          </button>
        </div>
      </div>

      {/* Right Column: Content and Comments */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                  {post.account?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-zinc-800 flex items-center gap-1.5">
                  {post.account?.username || 'Người dùng ẩn danh'}
                </h2>
                <div className="text-[12px] text-zinc-400">{formatRelativeTime(post.created_at)}</div>
              </div>
            </div>
          </div>

          <p className="text-zinc-600 whitespace-pre-line text-[15px] leading-relaxed mb-8 mt-2">
            {post.caption || ''}
          </p>

          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-zinc-400 font-medium">Tương tác:</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 font-bold text-zinc-600 bg-red-50/50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-50">
                <span className="text-red-500">❤️</span> {post.likes_count ?? 0}
              </button>
              <button className="flex items-center gap-1.5 font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100">
                <span>💬</span> {post.comments_count ?? 0}
              </button>
              <button className="flex items-center gap-1.5 font-bold text-zinc-600 bg-amber-50/50 border border-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-50">
                <span>👁️</span> {post.views_count ?? 0}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-zinc-800 flex items-center gap-2">
              <MessageCircle className="text-blue-500" /> Thảo luận & Hỏi đáp <span className="bg-blue-100 text-blue-600 text-[12px] px-2 py-0.5 rounded-full">{post.comments_count ?? 0}</span>
            </h3>
            <div className="flex bg-zinc-100 p-1 rounded-lg text-[12px] font-medium text-zinc-500">
              <button className="px-3 py-1 bg-white rounded shadow-sm text-zinc-800">Mới nhất</button>
              <button className="px-3 py-1 hover:text-zinc-700">Phổ biến nhất</button>
              <button className="px-3 py-1 hover:text-zinc-700">Đã chụp</button>
            </div>
          </div>
          
          <DiscussionSection postId={post.id} />
        </div>
      </div>
    </div>
  );
}
