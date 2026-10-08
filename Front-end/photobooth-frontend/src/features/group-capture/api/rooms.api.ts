import { Room } from '../types';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { API_BASE_URL } from '@/api/apiConfig';

const API = API_BASE_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface RoomResultPayload {
  photo?: { processed_file_url?: string | null };
  recording?: { file_url?: string | null };
  gif?: { image_url?: string | null };
  sessionResult?: { id: string };
}

function getToken() {
  return useAuthStore.getState().token || localStorage.getItem('accessToken');
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {})
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ApiError(res.status, errorData?.message ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const roomsApi = {
  create: (dto: { name?: string; max_participants: number; countdown_seconds: number }) => req<Room>('/rooms', json(dto)),

  selectFrame: (id: string, frameId: string) =>
    req(`/rooms/${id}/frame`, { ...json({ frameId }), method: 'PATCH' }),

  getByCode: (code: string) => req<Room>(`/rooms/code/${code}`),

  join: (id: string) => req(`/rooms/${id}/join`, json({})),

  ready: (id: string) => req(`/rooms/${id}/participants/me/ready`, { method: 'PATCH' }),

  openStudio: (id: string) => req(`/rooms/${id}/open-studio`, json({})),

  setEditPolicy: (id: string, policy: 'host_only' | 'all_participants') =>
    req<{ roomId: string; edit_policy: 'host_only' | 'all_participants' }>(`/rooms/${id}/edit-policy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy }),
    }),

  livekitToken: (id: string) => req<{ token: string; url: string }>(`/rooms/${id}/livekit-token`, json({})),

  startCountdown: (id: string) => req(`/rooms/${id}/start-countdown`, json({})),

  uploadCapture: async (id: string, jpeg: Blob, roundIndex: number) => {
    const f = new FormData();
    f.append('file', jpeg, 'capture.jpg');
    f.append('roundIndex', String(roundIndex));
    const token = getToken();
    const res = await axios.post(`${API}/rooms/${id}/captures`, f, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getCapture: async (id: string, slotIndex: number) => {
    const res = await fetch(`${API}/rooms/${id}/captures/${slotIndex}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new ApiError(res.status, res.status === 410 ? 'Ảnh raw đã hết hạn' : 'Lỗi tải ảnh');
    return res.blob();
  },

  compose: async (id: string, original: Blob, processed: Blob, recordingId?: string, gifId?: string) => {
    const f = new FormData();
    f.append('original', original, 'original.png');
    f.append('processed', processed, 'processed.png');
    if (recordingId) f.append('recordingId', recordingId);
    if (gifId) f.append('gifId', gifId);

    const token = getToken();
    const res = await axios.post(`${API}/rooms/${id}/compose`, f, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  result: (id: string) => req<RoomResultPayload>(`/rooms/${id}/result`),
};
