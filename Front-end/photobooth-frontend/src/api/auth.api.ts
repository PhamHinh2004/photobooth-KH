import axiosInstance from './axios'
import type { ApiResponse, AuthResponse, CustomerProfile, LoginRequest, PhotoSession, RegisterRequest, User } from '@/types/auth.types'

export const authApi = {
  /**
   * Đăng nhập
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Đăng ký tài khoản
   */
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/register', data)
    return response.data
  },

  verifyRegistrationOtp: async (data: { email: string; otp: string }): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/verify-registration-otp', data)
    return response.data
  },

  resendRegistrationOtp: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/resend-registration-otp', data)
    return response.data
  },

  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/forgot-password', data)
    return response.data
  },

  resendForgotPasswordOtp: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/resend-forgot-password-otp', data)
    return response.data
  },

  verifyForgotPasswordOtp: async (data: { email: string; otp: string }): Promise<{ resetToken: string; message: string }> => {
    const response = await axiosInstance.post<{ resetToken: string; message: string }>('/auth/verify-otp', data)
    return response.data
  },

  resetPassword: async (data: { email: string; resetToken: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/reset-password', data)
    return response.data
  },

  /**
   * Lấy thông tin user hiện tại (yêu cầu token)
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me')
    return response.data
  },

  getMyProfile: async (): Promise<CustomerProfile> => {
    const response = await axiosInstance.get<CustomerProfile>('/customers/me/profile')
    return response.data
  },

  updateMyProfile: async (data: Partial<Pick<CustomerProfile, 'fullName' | 'birthday' | 'city' | 'gender' | 'image'>>): Promise<CustomerProfile> => {
    const response = await axiosInstance.patch<CustomerProfile>('/customers/me/profile', data)
    return response.data
  },

  getMyPhotoHistory: async (params: { type?: 'solo' | 'group'; order: 'newest' | 'oldest' }): Promise<{ data: PhotoSession[]; total: number }> => {
    const response = await axiosInstance.get<{ data: PhotoSession[]; total: number }>('/customers/me/photo-history', { params })
    return response.data
  },

  saveMyPhoto: async (data: { sessionType: 'solo' | 'group'; imageUrl: string; title?: string }): Promise<PhotoSession> => {
    const response = await axiosInstance.post<PhotoSession>('/customers/me/photo-history', data)
    return response.data
  },
}
