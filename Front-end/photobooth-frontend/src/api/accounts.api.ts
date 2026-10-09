import axiosInstance from './axios'

export interface Account {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    fullName: string
    dateOfBirth?: string
    phoneNumber?: string
  }
}

export interface AccountsMetrics {
  total: number
  active: number
  locked: number
  admin: number
  staff: number
  thisWeekTotal: number
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
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    )
    const response = await axiosInstance.get<PaginatedResponse<Account>>('/admin/accounts', { params: cleanParams })
    return response.data
  },
  
  getMetrics: async () => {
    const response = await axiosInstance.get<AccountsMetrics>('/admin/accounts/metrics')
    return response.data
  },
  
  updateStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/admin/accounts/${id}/status`, { isActive })
    return response.data
  },
  
  updateRole: async (id: string, role: string) => {
    const response = await axiosInstance.patch(`/admin/accounts/${id}/role`, { role })
    return response.data
  },
  
  exportCsv: (params: GetAccountsParams) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    )
    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString()
    window.open(`${axiosInstance.defaults.baseURL}/admin/accounts/export?${queryString}`, '_blank')
  },
  
  getAccountDetail: async (id: string) => {
    const response = await axiosInstance.get<Account>(`/admin/accounts/${id}`)
    return response.data
  }
}
