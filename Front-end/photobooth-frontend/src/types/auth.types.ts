// Auth related types

export type GenderOption = 'nam' | 'nu' | 'khac'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone: string
}

export interface LoginFormValues {
  email: string
  password: string
}

export interface RegisterFormValues {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordFormValues {
  contact: string
  newPassword: string
  confirmPassword: string
}

export interface User {
  id: string | number
  email: string
  name: string
  role?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerProfile {
  id: string
  fullName: string | null
  image: string | null
  phone: string | null
  birthday: string | null
  city: string | null
  gender: 'male' | 'female' | 'others' | null
  createdAt: string
  account: {
    id: string
    email: string
    createdAt: string
  }
}

export interface PhotoSession {
  id: string
  accountId: string
  sessionType: 'solo' | 'group'
  imageUrl: string
  title: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
}

export interface AuthErrorResponse {
  message?: string
}

export interface ApiResponse<T = unknown> {
  statusCode: number
  message: string
  data: T
  timestamp: string
}
