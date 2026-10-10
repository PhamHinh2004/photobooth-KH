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
}