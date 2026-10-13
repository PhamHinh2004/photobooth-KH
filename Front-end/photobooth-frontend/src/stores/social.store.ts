import { create } from 'zustand';
import { socialApi } from '../api/social.api';

interface SocialState {
  savedPostIds: string[];
  likedPostIds: string[];
  fetchInteractions: () => Promise<void>;
  clearInteractions: () => void;
}

export const useSocialStore = create<SocialState>((set) => ({
  savedPostIds: [],
  likedPostIds: [],
  fetchInteractions: async () => {
    try {
      const data = await socialApi.getMyInteractions();
      set({
        savedPostIds: data.savedPostIds || [],
        likedPostIds: data.likedPostIds || [],
      });
    } catch (e) {
      console.error('Failed to fetch interactions', e);
    }
  },
  clearInteractions: () => {
    set({ savedPostIds: [], likedPostIds: [] });
  }
}));

