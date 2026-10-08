import { useState } from 'react';
import { DiscussionSection } from './DiscussionSection';
import { LikeButton } from './LikeButton';
import { useNavigate } from 'react-router-dom';
import { Download, Bookmark, Share2, Maximize2, Users, ArrowLeft, MessageCircle } from 'lucide-react';
import { sharePostToFacebook } from '../../utils/facebookShare';

interface PostDetailLayoutProps {
  post: any;
  onCommentDeleted?: () => void;
}

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

export function PostDetailLayout({ post, onCommentDeleted }: PostDetailLayoutProps) {
  const navigate = useNavigate();
  const [shareMessage, setShareMessage] = useState('');
  const frame = post.session?.photo?.frame;
  const frameWidth = Number(frame?.width);
  const frameHeight = Number(frame?.height);
  const frameScale = frameWidth > 0 && frameHeight > 0 ? Math.min(48 / frameWidth, 68 / frameHeight) : 1;
  const framePreviewStyle = frameWidth > 0 && frameHeight > 0
    ? { width: `${Math.max(10, frameWidth * frameScale)}px`, height: `${Math.max(12, frameHeight * frameScale)}px` }
    : { width: '34px', height: '56px' };

  const handleApplyFrame = () => {
    if (frame?.id) {
      navigate('/capture', { state: { initialFrameId: frame.id, initialFrame: frame } });
    } else {
      navigate('/capture');
    }
  };

  const showShareMessage = (message: string) => {
    setShareMessage(message);
    window.setTimeout(() => setShareMessage(''), 3000);
  };

  const handleFacebookShare = async () => {
    const result = await sharePostToFacebook(post.id);
    showShareMessage(result.opened ? 'Đã mở cửa sổ chia sẻ Facebook' : 'Đã sao chép link bài viết');
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

        {frame && (
          <section className="overflow-hidden rounded-2xl border border-[#d7e7ec] bg-white shadow-[0_10px_28px_rgba(23,23,25,0.08)]" aria-label="Thông số frame">
            <div className="h-1 bg-gradient-to-r from-[#0284c7] via-[#9ed9e4] to-[#f85ca8]" />
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <div className="grid h-24 w-20 shrink-0 place-items-center rounded-xl border border-[#d7e7ec] bg-[#eff8fa]">
                <div
                  className="relative rounded-[3px] border-2 border-[#0284c7] bg-[repeating-linear-gradient(135deg,#fff_0_6px,#fce9ec_6px_12px)] shadow-[3px_3px_0_rgba(233,69,96,0.2)]"
                  style={framePreviewStyle}
                  aria-hidden="true"
                >
                  <span className="absolute inset-x-1/2 top-1/2 h-px w-2 -translate-x-1/2 bg-[#0284c7]/60" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-[#0284c7]">
                  <Maximize2 size={14} />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]">Thông số frame</span>
                </div>
                <h3 className="mb-3 truncate text-base font-bold text-[#171719]">{frame.name || 'Frame'}</h3>
                <dl className="grid grid-cols-3 gap-2">
                  <div className="min-w-0 rounded-lg bg-[#f3f8fa] px-2.5 py-2">
                    <dt className="text-[9px] font-medium uppercase text-[#716b67]">Rộng</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-[#171719]">{frameWidth > 0 ? `${frameWidth} px` : '—'}</dd>
                  </div>
                  <div className="min-w-0 rounded-lg bg-[#f3f8fa] px-2.5 py-2">
                    <dt className="text-[9px] font-medium uppercase text-[#716b67]">Cao</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-[#171719]">{frameHeight > 0 ? `${frameHeight} px` : '—'}</dd>
                  </div>
                  <div className="min-w-0 rounded-lg bg-[#fff2f4] px-2.5 py-2">
                    <dt className="text-[9px] font-medium uppercase text-[#8a4b58]">Tỉ lệ</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-[#c73652]">{frame.aspect_ratio || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}

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
          <button onClick={handleFacebookShare} className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700">
            <Share2 size={20} className="text-zinc-400" />
            <span className="text-[12px] font-bold">Facebook</span>
          </button>
        </div>
        {shareMessage && <p className="text-center text-xs font-medium text-emerald-600">{shareMessage}</p>}
      </div>

      {/* Right Column: Content and Comments */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {(post.account?.customer?.image || post.account?.avatarUrl || post.account?.avatar_url) ? (
                  <img src={post.account?.customer?.image || post.account?.avatarUrl || post.account?.avatar_url} alt={post.account?.customer?.fullName || post.account?.customer?.full_name || post.account?.username} className="w-14 h-14 rounded-full object-cover shadow-inner" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                    {(post.account?.customer?.fullName || post.account?.customer?.full_name || post.account?.full_name || post.account?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-zinc-800 flex items-center gap-1.5">
                  {post.account?.customer?.fullName || post.account?.customer?.full_name || post.account?.full_name || post.account?.username || 'Người dùng ẩn danh'}
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
              <LikeButton
                postId={post.id}
                initialCount={post.likes_count ?? 0}
                className="gap-1.5 font-bold text-zinc-600 bg-red-50/50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-50"
              />
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
          
          <DiscussionSection postId={post.id} onCommentDeleted={onCommentDeleted} />
        </div>
      </div>
    </div>
  );
}
