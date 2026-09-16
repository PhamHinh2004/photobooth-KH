import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin.api'
import { useAuthStore } from '@/stores/auth.store'
import type { AccountRole, AdminAccount, PaginationMeta } from '@/types/admin.types'
import './AdminAccountsPage.css'

const initialMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 0 }

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))

const roleLabel: Record<AccountRole, string> = {
  admin: 'Admin',
  staff: 'Nhân viên',
  customer: 'Khách hàng',
}

const AdminAccountsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [meta, setMeta] = useState(initialMeta)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [role, setRole] = useState<AccountRole | ''>('')
  const [isActive, setIsActive] = useState<'' | 'true' | 'false'>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [navigate, user?.role])

  useEffect(() => {
    if (user?.role !== 'admin') return

    const loadAccounts = async () => {
      setLoading(true)
      try {
        const result = await adminApi.getAccounts({
          page: meta.page,
          limit: meta.limit,
          search: search || undefined,
          role: role || undefined,
          isActive: isActive === '' ? undefined : isActive === 'true',
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        })
        setAccounts(result.data)
        setMeta(result.meta)
      } catch {
        message.error('Không thể tải danh sách tài khoản.')
      } finally {
        setLoading(false)
      }
    }

    void loadAccounts()
  }, [isActive, meta.limit, meta.page, role, search, user?.role])

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMeta((current) => ({ ...current, page: 1 }))
    setSearch(searchInput.trim())
  }

  const updateFilter = (setter: (value: never) => void, value: never) => {
    setter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  if (user?.role !== 'admin') return null

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <button className="admin-brand" onClick={() => navigate('/')}><span>KH</span> BOOTH</button>
        <div className="admin-topbar-user"><span>ĐANG ĐĂNG NHẬP</span><strong>{user.name}</strong><button onClick={() => navigate('/')}>Về trang chủ</button></div>
      </header>

      <main className="admin-shell">
        <div className="admin-heading"><div><p className="admin-kicker">ADMIN CONSOLE / ACCOUNTS</p><h1>Quản lý tài khoản</h1><p className="admin-description">Theo dõi tài khoản trong hệ thống Photobooth.</p></div><div className="admin-total"><strong>{meta.total}</strong><span>TỔNG TÀI KHOẢN</span></div></div>

        <section className="admin-panel">
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={submitSearch}><span className="material-symbols-outlined">search</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm email, username hoặc tên..." /><button type="submit">Tìm kiếm</button></form>
            <div className="admin-filters"><select aria-label="Lọc theo vai trò" value={role} onChange={(event) => updateFilter(setRole as (value: never) => void, event.target.value as never)}><option value="">Tất cả vai trò</option><option value="admin">Admin</option><option value="staff">Nhân viên</option><option value="customer">Khách hàng</option></select><select aria-label="Lọc theo trạng thái" value={isActive} onChange={(event) => updateFilter(setIsActive as (value: never) => void, event.target.value as never)}><option value="">Mọi trạng thái</option><option value="true">Đang hoạt động</option><option value="false">Đã khóa</option></select></div>
          </div>

          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>TÀI KHOẢN</th><th>USERNAME</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="admin-state">ĐANG TẢI DỮ LIỆU...</td></tr> : accounts.length === 0 ? <tr><td colSpan={5} className="admin-state">Không tìm thấy tài khoản phù hợp.</td></tr> : accounts.map((account) => <tr key={account.id}><td><div className="account-cell"><span className="account-avatar">{(account.customer?.fullName || account.username || account.email).slice(0, 1).toUpperCase()}</span><div><strong>{account.customer?.fullName || account.username}</strong><small>{account.email}</small></div></div></td><td>{account.username}</td><td><span className={`role-badge role-${account.role}`}>{roleLabel[account.role]}</span></td><td><span className={`status-badge ${account.isActive ? 'status-active' : 'status-inactive'}`}><i />{account.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></td><td>{formatDate(account.createdAt)}</td></tr>)}</tbody></table></div>

          <footer className="admin-pagination"><span>Hiển thị {accounts.length ? (meta.page - 1) * meta.limit + 1 : 0} - {Math.min(meta.page * meta.limit, meta.total)} trong {meta.total}</span><div><button disabled={meta.page <= 1 || loading} onClick={() => setMeta((current) => ({ ...current, page: current.page - 1 }))} aria-label="Trang trước">←</button><strong>{meta.page} / {Math.max(meta.totalPages, 1)}</strong><button disabled={meta.page >= meta.totalPages || loading} onClick={() => setMeta((current) => ({ ...current, page: current.page + 1 }))} aria-label="Trang sau">→</button></div></footer>
        </section>
      </main>
    </div>
  )
}

export default AdminAccountsPage