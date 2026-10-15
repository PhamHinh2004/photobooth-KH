import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { API_BASE_URL } from './apiConfig'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor: gắn Bearer token vào mỗi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: xử lý lỗi 401 (token hết hạn)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.endsWith('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
