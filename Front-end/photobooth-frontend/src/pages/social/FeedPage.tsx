import { useEffect, useState } from 'react';
import { HeroSection } from '../../components/social/HeroSection';
import { FilterTabs } from '../../components/social/FilterTabs';
import { PostCard } from '../../components/social/PostCard';
import { useSocialSocket } from '../../hooks/useSocialSocket';
import { socialApi } from '../../api/social.api';
import { useAuthStore } from '../../stores/auth.store';
import { Pagination, Spin } from 'antd';

const PAGE_SIZE = 9;

export default function FeedPage() {
  const token = useAuthStore((state) => state.token);
  const { feed, setFeed, isConnected } = useSocialSocket(token || undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'group' | 'single'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadFeed() {
      try {
        setLoading(true);
        const result = await socialApi.getFeed(currentPage, PAGE_SIZE, activeTab === 'all' ? undefined : activeTab);
        if (!cancelled) {
          setFeed(result.data || []);
          setTotalPosts(result.total || 0);
        }
      } catch (error) {
        console.error('Failed to load feed', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFeed();
    return () => { cancelled = true; };
  }, [activeTab, currentPage, setFeed]);

  const changeFilter = (tab: 'all' | 'group' | 'single') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const stats = {
    rating: 4.9,
    views: '35.2K+',
    satisfaction: '98.6%',
  };

  return (
    <div className="min-h-screen pb-16">
      <HeroSection stats={stats} />

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-end mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <FilterTabs active={activeTab} onChange={changeFilter} />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">Chưa có đánh giá nào</h3>
            <p className="text-zinc-500">Hãy là người đầu tiên chia sẻ khoảnh khắc tại KH BOOTH!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {feed.slice(0, PAGE_SIZE).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && totalPosts > PAGE_SIZE && (
          <div className="mt-8 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={totalPosts}
              showSizeChanger={false}
              onChange={setCurrentPage}
              aria-label="Phân trang bài đánh giá"
            />
          </div>
        )}
      </div>
    </div>
  );
}
