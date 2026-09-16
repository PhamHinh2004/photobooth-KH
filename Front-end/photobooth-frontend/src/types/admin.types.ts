import type { User } from './auth.types'

export type AccountRole = 'admin' | 'staff' | 'customer'

export interface AccountCustomer {
  id: string
  fullName: string | null
  phone: string | null
}

export interface AdminAccount extends User {
  username: string
  role: AccountRole
  isActive: boolean
  customer?: AccountCustomer
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface AdminAccountQuery {
  page: number
  limit: number
  search?: string
  role?: AccountRole
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}