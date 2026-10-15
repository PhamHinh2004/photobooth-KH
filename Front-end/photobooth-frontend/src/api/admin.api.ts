import axiosInstance from './axios'
import type { AdminAccount, AdminAccountQuery, PaginatedResponse } from '@/types/admin.types'

export const adminApi = {
  getAccounts: async (params: AdminAccountQuery): Promise<PaginatedResponse<AdminAccount>> => {
    const response = await axiosInstance.get<PaginatedResponse<AdminAccount>>('/admin/accounts', { params })
    return response.data
  },
  
  createFrame: async (data: FormData): Promise<any> => {
    const response = await axiosInstance.post('/frames', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadAsset: async (file: File | Blob, folder = 'frame-assets'): Promise<{ fileUrl: string }> => {
    const formData = new FormData();
    const ext = (file instanceof File && file.name.split('.').pop()) || 'png';
    const filename = file instanceof File ? file.name : `asset_${Date.now()}.${ext}`;
    formData.append('file', file, filename);
    formData.append('folder', folder);
    const response = await axiosInstance.post('/storage-test/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /** Upload ảnh asset (idol, sticker, logo) lưu trực tiếp vào entity Photo */
  uploadFrameAsset: async (data: {
    file: File | Blob;
    name?: string;
    category?: string;
    width?: number;
    height?: number;
    metadata?: Record<string, any>;
  }): Promise<any> => {
    const formData = new FormData();
    const ext = (data.file instanceof File && data.file.name.split('.').pop()) || 'png';
    const filename = data.file instanceof File ? data.file.name : `asset_${Date.now()}.${ext}`;
    formData.append('file', data.file, filename);
    if (data.name) formData.append('name', data.name);
    if (data.category) formData.append('category', data.category);
    if (data.width) formData.append('width', String(data.width));
    if (data.height) formData.append('height', String(data.height));
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));

    const response = await axiosInstance.post('/photos/frame-asset', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /** Lấy danh sách ảnh asset đã lưu từ entity Photo trong database */
  getFrameAssets: async (category?: string, search?: string): Promise<any[]> => {
    const params: Record<string, any> = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    const response = await axiosInstance.get('/photos/frame-assets', { params });
    return response.data;
  },

  /** Cập nhật tên hoặc danh mục của asset trong entity Photo */
  updateFrameAsset: async (id: string, patch: { title?: string; asset_category?: string; metadata?: any }): Promise<any> => {
    const response = await axiosInstance.patch(`/photos/frame-assets/${id}`, patch);
    return response.data;
  },

  /** Xóa asset khỏi entity Photo */
  deleteFrameAsset: async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`/photos/frame-assets/${id}`);
    return response.data;
  },
}