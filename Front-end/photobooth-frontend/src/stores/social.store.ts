import { create } from 'zustand';
import { socialApi } from '../api/social.api';

interface SocialState {
  savedPostIds: string[];
  likedPostIds: string[];
  likedCommentIds: string[];
  fetchInteractions: () => Promise<void>;
  setLikedComment: (commentId: string, liked: boolean) => void;
  clearInteractions: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  savedPostIds: [],
  likedPostIds: [],
  likedCommentIds: [],
  fetchInteractions: async () => {
    try {
      const [data, likedComments] = await Promise.all([
        socialApi.getMyInteractions(),
        socialApi.getMyLikedComments().catch(() => []),
      ]);
      set({
        savedPostIds: data.savedPostIds || [],
        likedPostIds: data.likedPostIds || [],
        likedCommentIds: likedComments || [],
      });
    } catch (e) {
      console.error('Failed to fetch interactions', e);
    }
  },
  setLikedComment: (commentId: string, liked: boolean) => {
    const current = get().likedCommentIds;
    if (liked) {
      if (!current.includes(commentId)) set({ likedCommentIds: [...current, commentId] });
    } else {
      set({ likedCommentIds: current.filter((id) => id !== commentId) });
    }
  },
  clearInteractions: () => {
    set({ savedPostIds: [], likedPostIds: [], likedCommentIds: [] });
  },
}));

