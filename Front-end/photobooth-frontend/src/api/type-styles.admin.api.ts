import axiosInstance from './axios';

export interface TypeStyle {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TypeStyleStatItem extends TypeStyle {
  frame_count: number;
  active_frame_count: number;
  total_usage: number;
  avg_rating: number;
}

export interface TypeStyleStats {
  overview: {
    total_styles: number;
    active_styles: number;
    total_frames: number;
    assigned_frames: number;
    unassigned_frames: number;
    total_usage: number;
  };
  items: TypeStyleStatItem[];
}

export interface FrameItem {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  aspect_ratio?: string | null;
  session_type_supported: 'single' | 'group' | 'both';
  rating: number;
  rating_count: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export interface TypeStyleDetail extends TypeStyle {
  stats: {
    frame_count: number;
    active_frame_count: number;
    total_usage: number;
    avg_rating: number;
    total_rating_count: number;
    by_session_type: Record<string, number>;
    by_aspect_ratio: Record<string, number>;
    top_frame: FrameItem | null;
  };
  frames: FrameItem[];
}

export type TypeStylePayload = Partial<Pick<TypeStyle, 'name' | 'description' | 'is_active' | 'sort_order'>>;

export const typeStylesAdminApi = {
  getStats: async (): Promise<TypeStyleStats> => {
    const { data } = await axiosInstance.get('/type-styles/admin/stats');
    return data;
  },
  getDetail: async (id: string): Promise<TypeStyleDetail> => {
    const { data } = await axiosInstance.get(`/type-styles/${id}/frames`);
    return data;
  },
  getUnassignedFrames: async (): Promise<FrameItem[]> => {
    const { data } = await axiosInstance.get('/type-styles/admin/unassigned-frames');
    return data;
  },
  create: async (payload: TypeStylePayload) => {
    const { data } = await axiosInstance.post('/type-styles', payload);
    return data;
  },
  update: async (id: string, payload: TypeStylePayload) => {
    const { data } = await axiosInstance.patch(`/type-styles/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete(`/type-styles/${id}`);
    return data;
  },
  assignFrames: async (id: string, frameIds: string[]) => {
    const { data } = await axiosInstance.post(`/type-styles/${id}/frames`, { frame_ids: frameIds });
    return data;
  },
  unassignFrame: async (id: string, frameId: string) => {
    const { data } = await axiosInstance.delete(`/type-styles/${id}/frames/${frameId}`);
    return data;
  },
};
