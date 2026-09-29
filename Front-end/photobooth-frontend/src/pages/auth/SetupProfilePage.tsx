import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

type Province = { code: number; name: string }

const SetupProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [fullName, setFullName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [city, setCity] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'others'>('others')
  const [loading, setLoading] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name)
    }
    fetch('https://provinces.open-api.vn/api/?depth=1')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(() => {})
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      message.warning('Vui lòng nhập họ và tên!')
      return
    }
    
    setLoading(true)
    try {
      await authApi.updateMyProfile({ 
        fullName: fullName.trim(), 
        birthday: birthday ? new Date(birthday).toISOString() : undefined, 
        city, 
        gender 
      })
      
      message.success('Cập nhật thông tin thành công!')
      navigate('/', { replace: true })
    } catch (error) {
      message.error('Cập nhật thông tin thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden mx-auto">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e94560] to-[#A855F7]"></div>
      
      <div className="text-center mb-6">
        <h2 className="font-headline-lg text-2xl text-secondary mb-2">Hoàn tất hồ sơ</h2>
        <p className="text-sm text-on-surface-variant">Vui lòng cung cấp thêm thông tin để hoàn thành việc tạo tài khoản.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="fullName">Họ và tên</label>
          <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all" required />
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="birthday">Ngày sinh</label>
          <input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all" />
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="city">Thành phố</label>
          <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all bg-white">
            <option value="">Chọn tỉnh / thành phố</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="gender">Giới tính</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'others')} className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all bg-white">
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="others">Khác</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="mt-4 w-full bg-[#e94560] hover:bg-[#c73652] transition-colors rounded-full py-3.5 px-6 font-bold text-white flex justify-center items-center gap-2 shadow-lg disabled:opacity-50">
          <span>{loading ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </form>
    </div>
  )
}

export default SetupProfilePage
