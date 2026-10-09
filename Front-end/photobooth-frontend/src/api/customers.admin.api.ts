import axiosInstance from './axios';
import { PaginatedResponse } from '@/types/admin.types';

export interface CustomersMetrics {
  totalCustomers: number;
  linkedAccounts: number;
  linkedPercentage: number;
  feedbackRate: number;
  returnRate: number;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  city?: string;
  hasAccount?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const customersAdminApi = {
  getMetrics: async (): Promise<CustomersMetrics> => {
    const { data } = await axiosInstance.get('/admin/customers/metrics');
    return data;
  },
  getCustomers: async (params: GetCustomersParams): Promise<PaginatedResponse<any>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined)
    );
    const { data } = await axiosInstance.get('/admin/customers', { params: cleanParams });
    return data;
  },
  exportCsv: async (params: GetCustomersParams): Promise<Blob> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined)
    );
    const { data } = await axiosInstance.get('/admin/customers/export', {
      params: cleanParams,
      responseType: 'blob',
    });
    return data;
  },
  getCustomerDetail: async (id: string) => {
    const { data } = await axiosInstance.get(`/admin/customers/${id}`);
    return data;
  },
  getPhotoHistory: async (id: string) => {
    const { data } = await axiosInstance.get(`/admin/customers/${id}/photo-history`);
    return data;
  }
};
