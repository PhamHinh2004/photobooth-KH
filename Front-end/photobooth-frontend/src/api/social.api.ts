import axiosInstance from './axios';

export const socialApi = {
  getFeed: async (page = 1, limit = 10, filter = 'all') => {
    // In real app, append filter if API supports it
    const { data } = await axiosInstance.get(`/posts?page=${page}&limit=${limit}`);
    return data;
  },
  getPost: async (id: string) => {
    const { data } = await axiosInstance.get(`/posts/${id}`);
    return data;
  },
  toggleLike: async (postId: string) => {
    const { data } = await axiosInstance.post(`/posts/${postId}/like`);
    return data;
  },
  getComments: async (postId: string) => {
    const { data } = await axiosInstance.get(`/posts/${postId}/comments`);
    return data;
  },
  createComment: async (payload: { post_id: string; content: string; parent_comment_id?: string }) => {
    const { data } = await axiosInstance.post('/comments', payload);
    return data;
  },
  createPost: async (payload: { session_id: string; caption?: string; cover_image_url: string; style_tags?: string[] }) => {
    const { data } = await axiosInstance.post('/posts', payload);
    return data;
  },
  getMyPosts: async (page = 1, limit = 10) => {
    const { data } = await axiosInstance.get(`/posts/me?page=${page}&limit=${limit}`);
    return data;
  },
  deletePost: async (id: string) => {
    const { data } = await axiosInstance.delete(`/posts/${id}`);
    return data;
  }
};
