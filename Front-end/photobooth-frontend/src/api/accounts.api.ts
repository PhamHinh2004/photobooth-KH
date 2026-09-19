import axiosInstance from './axios'

export interface Account {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GetAccountsParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: boolean | string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const accountsApi = {
  getAccounts: async (params: GetAccountsParams) => {
    // Remove empty parameters (empty strings/undefined) so backend receives a clean query
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    )
    const response = await axiosInstance.get<PaginatedResponse<Account>>('/admin/accounts', { params: cleanParams })
    return response.data
  },
}
