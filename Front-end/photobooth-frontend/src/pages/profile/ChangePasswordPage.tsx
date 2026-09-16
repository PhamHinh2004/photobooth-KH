import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'
import './ChangePasswordPage.css'

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword'

const getApiError = (error: unknown, fallback: string) => {
  const apiMessage = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
  return Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage || fallback
}

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const updateField = (field: PasswordField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrorMsg(null)
  }

  const toggleVisibility = (field: PasswordField) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = form

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg('Mật khẩu mới phải có chữ hoa, chữ thường và số.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.')
      return
    }
    if (newPassword === currentPassword) {
      setErrorMsg('Mật khẩu mới không được giống mật khẩu hiện tại.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await authApi.changePassword(form)
      message.success(response.message || 'Đổi mật khẩu thành công')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      navigate('/profile')
    } catch (error: unknown) {
      setErrorMsg(getApiError(error, 'Không thể đổi mật khẩu. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  const fields: Array<{ key: PasswordField; label: string; autoComplete: string }> = [
    { key: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
    { key: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
    { key: 'confirmPassword', label: 'Xác nhận mật khẩu mới', autoComplete: 'new-password' },
  ]

  return (
    <main className="change-password-page">
      <div className="change-password-noise" aria-hidden="true" />
      <section className="change-password-shell">
        <button type="button" className="change-password-back" onClick={() => navigate('/profile')}>
          <span aria-hidden="true">←</span> Quay lại hồ sơ
        </button>
        <div className="change-password-card">
          <div className="change-password-window"><span>SECURITY.SETTINGS</span><i /><i /><b /></div>
          <div className="change-password-heading">
            <p className="change-password-kicker">ACCOUNT SECURITY</p>
            <h1>Đổi mật khẩu<span>.</span></h1>
            <p>Cập nhật mật khẩu để giữ tài khoản của bạn luôn an toàn.</p>
          </div>

          {errorMsg && <div className="change-password-error" role="alert"><span className="material-symbols-outlined">warning</span>{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="change-password-form">
            {fields.map(({ key, label, autoComplete }) => (
              <label key={key} className="change-password-field">
                <span>{label}</span>
                <div className="change-password-input-wrap">
                  <input
                    type={visible[key] ? 'text' : 'password'}
                    value={form[key]}
                    onChange={(event) => updateField(key, event.target.value)}
                    autoComplete={autoComplete}
                    required
                  />
                  <button type="button" aria-label={visible[key] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => toggleVisibility(key)}>
                    <span className="material-symbols-outlined">{visible[key] ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </label>
            ))}
            <p className="change-password-hint">Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.</p>
            <button type="submit" className="change-password-submit" disabled={loading}>
              {loading ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
              <span className="material-symbols-outlined">lock_reset</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default ChangePasswordPage