import axiosInstance from './axios';

type SocialAccount = {
  id?: string;
  username?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  customer?: {
    fullName?: string | null;
    full_name?: string | null;
    image?: string | null;
  } | null;
};

type SocialItem = {
  account?: SocialAccount | null;
  account_id?: string;
};

type SocialComment = SocialItem & {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null;
  likes_count?: number;
};

const profileCache = new Map<string, any>();

export async function attachCustomerProfiles<T extends SocialItem>(items: T[]): Promise<T[]> {
  const accountIds = [...new Set(items
    .map((item) => item.account?.id || item.account_id)
    .filter((id): id is string => Boolean(id)))];

  const pendingIds = accountIds.filter(id => !profileCache.has(id));

  if (pendingIds.length > 0) {
    await Promise.all(pendingIds.map(async (accountId) => {
      try {
        const { data } = await axiosInstance.get(`/customers/account/${accountId}`);
        profileCache.set(accountId, data);
      } catch {
        profileCache.set(accountId, null);
      }
    }));
  }

  return items.map((item) => {
    const accountId = item.account?.id || item.account_id;
    const profile = accountId ? profileCache.get(accountId) : null;
    if (!profile) return item;

    return {
      ...item,
      account: {
        ...item.account,
        customer: item.account?.customer || profile,
      },
    } as T;
  });
}

export const socialApi = {
  getFeed: async (page = 1, limit = 10, filter = 'all') => {
    // In real app, append filter if API supports it
    const { data } = await axiosInstance.get(`/posts?page=${page}&limit=${limit}`);
    return { ...data, data: await attachCustomerProfiles(data.data || []) };
  },
  getPost: async (id: string) => {
    const { data } = await axiosInstance.get(`/posts/${id}`);
    const [post] = await attachCustomerProfiles([data]);
    return post;
  },
  toggleLike: async (postId: string) => {
    const { data } = await axiosInstance.post(`/posts/${postId}/like`);
    return data;
  },
  getComments: async (postId: string) => {
    const { data } = await axiosInstance.get(`/posts/${postId}/comments`);
    const comments: SocialComment[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];
    return attachCustomerProfiles(comments);
  },
  createComment: async (payload: { post_id: string; content: string; parent_comment_id?: string }) => {
    const { data } = await axiosInstance.post('/comments', payload);
    return data;
  },
  createPost: async (payload: { session_id: string; caption?: string; cover_image_url: string; style_tags?: string[]; rating?: number }) => {
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
