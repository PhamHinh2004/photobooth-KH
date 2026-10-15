import axiosInstance from './axios';

export interface ReviewsMetrics {
  totalPosts: number;
  pendingPosts: number;
  averageRating: number;
  totalInteractions: number;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  rating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const reviewsAdminApi = {
  getMetrics: async (): Promise<ReviewsMetrics> => {
    const { data } = await axiosInstance.get('/admin/reviews/metrics');
    return data;
  },
  getReviews: async (params: GetReviewsParams) => {
    const { data } = await axiosInstance.get('/admin/reviews', { params });
    return data;
  },
  exportCsv: async (params: GetReviewsParams): Promise<Blob> => {
    const { data } = await axiosInstance.get('/admin/reviews/export', {
      params,
      responseType: 'blob',
    });
    return data;
  },
  getReviewDetail: async (id: string) => {
    const { data } = await axiosInstance.get(`/admin/reviews/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await axiosInstance.patch(`/admin/reviews/${id}/status`, { status });
    return data;
  },
  updatePin: async (id: string, is_pinned: boolean) => {
    const { data } = await axiosInstance.patch(`/admin/reviews/${id}/pin`, { is_pinned });
    return data;
  },
  deleteReview: async (id: string) => {
    const { data } = await axiosInstance.delete(`/admin/reviews/${id}`);
    return data;
  }
};
