import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'
import { socialApi } from '@/api/social.api'
import { useAuthStore } from '@/stores/auth.store'
import type { CustomerProfile, PhotoSession } from '@/types/auth.types'
import './ProfilePage.css'

type Province = { code: number; name: string }
type HistoryFilter = 'all' | 'solo' | 'group'
type SortOrder = 'newest' | 'oldest'

const PAGE_SIZE = 9

// Unified memory item combining PhotoSession + social posts
type MemoryItem = {
  id: string
  sessionType: 'solo' | 'group'
  imageUrl: string
  title: string | null
  createdAt: string
  source: 'history' | 'post'
  isPosted: boolean
}

const provinceApiUrl = 'https://provinces.open-api.vn/api/?depth=1'

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : 'Chưa cập nhật'

const ProfilePage = () => {
  const navigate = useNavigate()
  const setAuthUser = useAuthStore((state) => state.setUser)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [history, setHistory] = useState<MemoryItem[]>([])
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: '', birthday: '', city: '', gender: 'others' as CustomerProfile['gender'], image: '' })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, provincesResponse] = await Promise.all([
          authApi.getMyProfile(),
          fetch(provinceApiUrl).then((response) => response.json() as Promise<Province[]>),
        ])
        setProfile(profileData)
        setProvinces(provincesResponse)
        setForm({ fullName: profileData.fullName || '', birthday: profileData.birthday?.slice(0, 10) || '', city: profileData.city || '', gender: profileData.gender || 'others', image: profileData.image || '' })
      } catch {
        message.error('Không thể tải hồ sơ. Vui lòng đăng nhập lại.')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [navigate])

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        // Lấy cả 2 nguồn dữ liệu song song
        const [histResult, postsResult] = await Promise.allSettled([
          authApi.getMyPhotoHistory({ type: filter === 'all' ? undefined : filter, order: sort }),
          socialApi.getMyPosts(1, 100),
        ])

        // Ảnh từ photo_sessions (lần chụp mới)
        const sessionItems: MemoryItem[] = histResult.status === 'fulfilled'
          ? (histResult.value.data || []).map((s: PhotoSession) => ({
              id: s.id,
              sessionType: s.sessionType,
              imageUrl: s.imageUrl,
              title: s.title,
              createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt).toISOString(),
              source: 'history' as const,
              isPosted: false,
            }))
          : []

        // Ảnh từ các bài đăng xã hội (backfill dữ liệu cũ)
        const postItems: MemoryItem[] = postsResult.status === 'fulfilled' && postsResult.value
          ? ((postsResult.value as any)?.data || []).map((p: any) => ({
              id: `post-${p.id}`,
              sessionType: (p.session?.session_type === 'group' ? 'group' : 'solo') as 'solo' | 'group',
              imageUrl: p.cover_image_url,
              title: p.session?.photo?.frame?.name || p.caption || null,
              createdAt: p.created_at,
              source: 'post' as const,
              isPosted: p.status === 'published',
            })).filter((item: MemoryItem) => filter === 'all' || item.sessionType === filter)
          : []

        // Hợp nhất, loại bỏ trùng lặp theo imageUrl, sắp xếp theo ngày
        const itemsByUrl = new Map<string, MemoryItem>()
        const merged: MemoryItem[] = []

        for (const item of [...sessionItems, ...postItems]) {
          if (!item.imageUrl) continue
          const existing = itemsByUrl.get(item.imageUrl)
          if (existing) {
            existing.isPosted ||= item.isPosted
            if (!existing.title) existing.title = item.title
            continue
          }
          itemsByUrl.set(item.imageUrl, item)
          merged.push(item)
        }

        merged.sort((a, b) =>
          sort === 'oldest'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setHistory(merged)
        setVisibleCount(PAGE_SIZE)
      } catch {
        message.error('Không thể tải lịch sử chụp.')
      } finally {
        setHistoryLoading(false)
      }
    }
    if (profile) void loadHistory()
  }, [filter, sort, profile])

  const totalPhotos = history.length
  const soloPhotos = history.filter((photo) => photo.sessionType === 'solo').length
  const groupPhotos = history.filter((photo) => photo.sessionType === 'group').length
  const displayImage = previewImage || form.image || profile?.image
  const initials = useMemo(() => (profile?.fullName || 'KH').split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase(), [profile?.fullName])
  const visibleHistory = history.slice(0, visibleCount)
  const hasMore = visibleCount < history.length

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleAvatar = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      message.warning('Vui lòng chọn file hình ảnh.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      message.warning('Ảnh đại diện không được lớn hơn 2MB.')
      return
    }
    setAvatarFile(file)
    setPreviewImage(URL.createObjectURL(file))
  }

  const saveProfile = async () => {
    if (!form.fullName.trim()) {
      message.warning('Họ và tên không được để trống.')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('fullName', form.fullName.trim())
      if (form.birthday) formData.append('birthday', form.birthday)
      if (form.city) formData.append('city', form.city)
      if (form.gender) formData.append('gender', form.gender)
      if (avatarFile) formData.append('image', avatarFile)

      const updated = await authApi.updateMyProfile(formData)
      setProfile(updated)
      const currentUser = useAuthStore.getState().user
      if (currentUser) setAuthUser({ ...currentUser, name: updated.fullName || currentUser.name, avatarUrl: updated.image })
      setEditing(false)
      setPreviewImage(null)
      message.success('Đã cập nhật hồ sơ.')
    } catch {
      message.error('Cập nhật hồ sơ thất bại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="profile-loading">ĐANG TẢI HỒ SƠ...</div>
  if (!profile) return null

  return (
    <div className="profile-page">
      <div className="profile-noise" aria-hidden="true" />
      <span className="profile-spark profile-spark-one" aria-hidden="true">✦</span>
      <span className="profile-spark profile-spark-two" aria-hidden="true">✦</span>
      <header className="profile-topbar">
        <button className="profile-brand" onClick={() => navigate('/')}><span>KH</span> BOOTH</button>
        <button className="profile-back" onClick={() => navigate('/')}>← Về trang chủ</button>
      </header>

      <main className="profile-shell">
        <div className="profile-heading"><div><p className="profile-kicker">YOUR PERSONAL SPACE</p><h1>Hồ sơ <em>của bạn.</em></h1></div><span className="profile-id">ID / {profile.account.id.slice(0, 8).toUpperCase()}</span></div>

        <section className="profile-overview chrome-panel">
          <div className="profile-identity">
            <div className="profile-avatar">{displayImage ? <img src={displayImage} alt="Ảnh đại diện" /> : <span>{initials}</span>}{editing && <label className="avatar-edit"><input type="file" accept="image/*" onChange={(event) => handleAvatar(event.target.files?.[0])} />✎</label>}</div>
            <div><p className="profile-kicker">MEMBER SINCE</p><h2>{profile.fullName || 'Khách hàng'}</h2><p className="profile-email">{profile.account.email}</p></div>
          </div>
          <div className="profile-stats"><div><strong>{totalPhotos}</strong><span>ẢNH ĐÃ CHỤP</span></div><div><strong>{soloPhotos}</strong><span>SOLO</span></div><div><strong>{groupPhotos}</strong><span>GROUP</span></div></div>
        </section>

        <section className="profile-content-grid">
          <article className="profile-card profile-details-card chrome-panel"><div className="window-strip"><span>PROFILE.DAT</span><i /><i /><b /></div><div className="card-heading"><div><p className="profile-kicker">PERSONAL DETAILS</p><h2>Thông tin cá nhân</h2></div>{editing ? <div className="detail-actions"><button onClick={() => setEditing(false)}>Hủy</button><button className="save-button" onClick={() => void saveProfile()} disabled={saving}>{saving ? 'ĐANG LƯU' : 'LƯU THAY ĐỔI'}</button></div> : <button className="edit-button" onClick={() => setEditing(true)}>✎ Chỉnh sửa</button>}</div>
            <div className="details-form"><label>HỌ VÀ TÊN<input disabled={!editing} value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} /></label><label>EMAIL ĐĂNG NHẬP<input value={profile.account.email} disabled /></label><label>SỐ ĐIỆN THOẠI<input value={profile.phone || 'Chưa cập nhật'} disabled /></label><label>NGÀY SINH<input type="date" disabled={!editing} value={form.birthday} onChange={(event) => updateField('birthday', event.target.value)} /></label><label>THÀNH PHỐ<select disabled={!editing} value={form.city} onChange={(event) => updateField('city', event.target.value)}><option value="">Chọn tỉnh / thành phố</option>{provinces.map((province) => <option key={province.code} value={province.name}>{province.name}</option>)}</select></label><label>GIỚI TÍNH<select disabled={!editing} value={form.gender || 'others'} onChange={(event) => updateField('gender', event.target.value)}><option value="male">Nam</option><option value="female">Nữ</option><option value="others">Khác</option></select></label></div>
            <div className="joined-date"><span>◷</span><div><small>NGÀY GIA NHẬP</small><strong>{formatDate(profile.account.createdAt)}</strong></div></div>
          </article>

          <article className="profile-card history-card chrome-panel">
            <div className="window-strip"><span>MEMORIES.LOG</span><i /><i /><b /></div>

            {/* Header */}
            <div className="card-heading">
              <div>
                <p className="profile-kicker">YOUR MEMORIES</p>
                <h2>Lịch sử chụp</h2>
              </div>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>

            {/* Stats bar */}
            {history.length > 0 && (
              <div className="history-stats-bar">
                <div className="history-stat">
                  <span className="history-stat-value">{totalPhotos}</span>
                  <span className="history-stat-label">Tổng lần chụp</span>
                </div>
                <div className="history-stat">
                  <span className="history-stat-value solo">{soloPhotos}</span>
                  <span className="history-stat-label">Chụp đơn</span>
                </div>
                <div className="history-stat">
                  <span className="history-stat-value group">{groupPhotos}</span>
                  <span className="history-stat-label">Chụp nhóm</span>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="history-tabs">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                Tất cả {filter === 'all' && history.length > 0 && <span className="tab-badge">{totalPhotos}</span>}
              </button>
              <button className={filter === 'solo' ? 'active' : ''} onClick={() => setFilter('solo')}>
                Chụp đơn {filter === 'solo' && history.length > 0 && <span className="tab-badge">{soloPhotos}</span>}
              </button>
              <button className={filter === 'group' ? 'active' : ''} onClick={() => setFilter('group')}>
                Chụp nhóm {filter === 'group' && history.length > 0 && <span className="tab-badge">{groupPhotos}</span>}
              </button>
            </div>

            {/* Loading state */}
            {historyLoading ? (
              <div className="history-loading">
                <div className="history-loading-dots">
                  <span /><span /><span />
                </div>
                <p>Đang tải lịch sử...</p>
              </div>
            ) : history.length ? (
              <>
                <div className="photo-grid">
                  {visibleHistory.map((photo) => (
                    <figure key={photo.id} className="photo-card">
                      <div className="photo-card-img-wrap">
                        <img src={photo.imageUrl} alt={photo.title || 'Ảnh photobooth'} loading="lazy" />
                        <div className="photo-card-overlay">
                          <span className={`photo-type-badge ${photo.sessionType}`}>
                            {photo.sessionType === 'solo' ? '👤 Solo' : '👥 Nhóm'}
                          </span>
                          <span className="photo-source-badge">{photo.isPosted ? 'Đã đăng' : 'Chỉ lưu'}</span>
                          <button
                            className="photo-view-btn"
                            onClick={() => window.open(photo.imageUrl, '_blank')}
                          >
                            🔍 Xem ảnh
                          </button>
                        </div>
                      </div>
                      <figcaption>
                        <span className={`session-dot ${photo.sessionType}`} />
                        <small>{formatDate(photo.createdAt)}</small>
                        {photo.title && <small className="photo-title-label" title={photo.title}>— {photo.title.length > 18 ? photo.title.slice(0, 18) + '…' : photo.title}</small>}
                      </figcaption>
                    </figure>
                  ))}
                </div>

                {/* Show more / summary */}
                <div className="history-footer">
                  <span className="history-showing">
                    Hiển thị <strong>{visibleHistory.length}</strong> / <strong>{history.length}</strong> lần chụp
                  </span>
                  {hasMore && (
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    >
                      Xem thêm {Math.min(PAGE_SIZE, history.length - visibleCount)} ảnh ↓
                    </button>
                  )}
                  {!hasMore && history.length > PAGE_SIZE && (
                    <button
                      className="collapse-btn"
                      onClick={() => setVisibleCount(PAGE_SIZE)}
                    >
                      Thu gọn ↑
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="history-empty">
                <span>✦</span>
                <h3>Chưa có kỷ niệm nào</h3>
                <p>Những bức ảnh bạn lưu lại sẽ xuất hiện ở đây.</p>
                <button onClick={() => navigate('/capture')}>BẮT ĐẦU CHỤP ↗</button>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

export default ProfilePage
