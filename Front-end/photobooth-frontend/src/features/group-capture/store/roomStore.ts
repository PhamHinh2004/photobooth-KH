import { create } from 'zustand';
import { Room } from '../types';

interface GroupCaptureState {
  draft: {
    name: string;
    maxParticipants: number;
    lobbyMinutes: number;
  };
  setDraft: (draft: Partial<GroupCaptureState['draft']>) => void;
  
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  
  selectedFrameId: string | null;
  setSelectedFrameId: (id: string | null) => void;
  selectedLayoutId: string | null;
  setSelectedLayoutId: (id: string | null) => void;
}

export const useGroupCaptureStore = create<GroupCaptureState>((set) => ({
  draft: {
    name: 'Hội Bạn Thân',
    maxParticipants: 4,
    lobbyMinutes: 2,
  },
  setDraft: (updates) => set((state) => ({ draft: { ...state.draft, ...updates } })),
  
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  selectedFrameId: null,
  setSelectedFrameId: (id) => set({ selectedFrameId: id }),
  selectedLayoutId: null,
  setSelectedLayoutId: (id) => set({ selectedLayoutId: id }),
}));
