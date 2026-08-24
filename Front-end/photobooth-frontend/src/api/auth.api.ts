import axiosInstance from './axios'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth.types'

export const authApi = {
  /**
   * Đăng nhập
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return response.data
  },

  /**
   * Đăng ký tài khoản
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return response.data
  },

  /**
   * Lấy thông tin user hiện tại (yêu cầu token)
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me')
    return response.data
  },
}
