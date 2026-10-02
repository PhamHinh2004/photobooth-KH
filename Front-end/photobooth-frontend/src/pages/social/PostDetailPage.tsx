import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socialApi } from '../../api/social.api';
import { PostDetailLayout } from '../../components/social/PostDetailLayout';
import { Spin } from 'antd';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await socialApi.getPost(id);
        setPost(data);
      } catch (error) {
        console.error('Failed to load post', error);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h2>
        <button onClick={() => navigate('/reviews')} className="text-pink-500 hover:underline">
          Quay lại trang cộng đồng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <button 
          onClick={() => navigate('/reviews')} 
          className="text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-2 transition-colors"
        >
          ← Quay lại Cộng đồng Đánh giá
        </button>
      </div>
      <PostDetailLayout post={post} />
    </div>
  );
}
