import React, { useEffect, useState } from 'react';
import { socialApi } from '../../api/social.api';
import { PostCard } from '../../components/social/PostCard';
import { Loader2 } from 'lucide-react';

export default function MySavedPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchPosts() {
      try {
        setLoading(true);
        const { data } = await socialApi.getMySavedPosts(1, 20);
        if (!cancelled) {
          setPosts(data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không thể tải kho lưu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchPosts();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800">Kho Lưu Của Tôi</h1>
        <div className="text-sm text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full font-medium">
          {posts.length} bài
        </div>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center text-zinc-500 py-12 bg-white rounded-2xl border border-zinc-200">
          <p className="text-lg font-medium text-zinc-600 mb-2">Kho lưu trống</p>
          <p className="text-sm">Bạn chưa lưu bài viết nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
