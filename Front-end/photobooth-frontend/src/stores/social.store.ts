import { create } from 'zustand';
import { socialApi } from '../api/social.api';

interface SocialState {
  savedPostIds: string[];
  repostedPostIds: string[];
  likedPostIds: string[];
  fetchInteractions: () => Promise<void>;
  clearInteractions: () => void;
}

export const useSocialStore = create<SocialState>((set) => ({
  savedPostIds: [],
  repostedPostIds: [],
  likedPostIds: [],
  fetchInteractions: async () => {
    try {
      const data = await socialApi.getMyInteractions();
      set({
        savedPostIds: data.savedPostIds || [],
        repostedPostIds: data.repostedPostIds || [],
        likedPostIds: data.likedPostIds || [],
      });
    } catch (e) {
      console.error('Failed to fetch interactions', e);
    }
  },
  clearInteractions: () => {
    set({ savedPostIds: [], repostedPostIds: [], likedPostIds: [] });
  }
}));
