import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 1 | 2 | 3

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 2 || secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(value - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [step, secondsLeft])

  const getApiError = (error: unknown, fallback: string) => {
    const apiMessage = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
    return Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage || fallback
  }

  const handleSendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!emailPattern.test(normalizedEmail)) {
      setErrorMsg('Email không đúng định dạng.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await authApi.forgotPassword({ email: normalizedEmail })
      setEmail(normalizedEmail)
      setOtp('')
      setSecondsLeft(120)
      setStep(2)
      message.success(response.message)
    } catch (error: unknown) {
      setErrorMsg(getApiError(error, 'Email chưa tồn tại trong hệ thống.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('OTP phải gồm 6 chữ số.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await authApi.verifyForgotPasswordOtp({ email, otp })
      setResetToken(response.resetToken)
      setStep(3)
      message.success('Xác thực OTP thành công!')
    } catch (error: unknown) {
      setErrorMsg(getApiError(error, 'OTP không hợp lệ hoặc đã hết hạn.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await authApi.resendForgotPasswordOtp({ email })
      setOtp('')
      setSecondsLeft(120)
      message.success(response.message)
    } catch (error: unknown) {
      setErrorMsg(getApiError(error, 'Không thể gửi lại mã OTP.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      const response = await authApi.resetPassword({ email, resetToken, newPassword })
      message.success(response.message)
      navigate('/login', { replace: true })
    } catch (error: unknown) {
      setErrorMsg(getApiError(error, 'Không thể đổi mật khẩu.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface/60 backdrop-blur-2xl rounded-xl p-6 md:p-8 chrome-border relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-surface-variant to-white/50 border-b border-white/80 flex items-center px-4 justify-between"><span className="font-label-mono text-[10px] text-tertiary">ResetPassword.exe</span><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-outline-variant" /><div className="w-3 h-3 rounded-full bg-outline-variant" /><div className="w-3 h-3 rounded-full bg-error" /></div></div>
      <div className="mt-6 flex flex-col gap-5">
        <div className="text-center mb-2"><h2 className="font-headline-lg text-2xl text-secondary">Quên mật khẩu?</h2><p className="text-sm text-on-surface-variant">{step === 1 ? 'Nhập email đã đăng ký để nhận mã khôi phục' : step === 2 ? `Nhập OTP vừa gửi tới ${email}` : 'Nhập mật khẩu mới cho tài khoản của bạn'}</p></div>
        {errorMsg && <div className="p-3 rounded-lg bg-error-container/30 border border-error text-error text-xs font-label-mono flex items-center gap-2"><span className="material-symbols-outlined text-sm">warning</span><span>{errorMsg}</span></div>}

        {step === 1 && <form onSubmit={handleSendCode} className="flex flex-col gap-5"><label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="forgotEmail">Email đăng nhập</label><input id="forgotEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" className="w-full rounded-lg border border-outline-variant p-3 text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary" autoComplete="email" required /><button type="submit" disabled={loading} className="w-full glossy-btn rounded-full py-3.5 text-white font-bold disabled:opacity-50">{loading ? 'ĐANG KIỂM TRA...' : 'GỬI MÃ KHÔI PHỤC'} <span className="material-symbols-outlined align-middle">send</span></button></form>}

        {step === 2 && <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5"><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="000000" className="w-full rounded-lg border border-outline-variant p-3 text-center text-2xl tracking-[0.4em] text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary" autoFocus /><button type="submit" disabled={loading} className="w-full rounded-full bg-secondary py-3.5 text-white font-bold disabled:opacity-50">{loading ? 'ĐANG XÁC NHẬN...' : 'XÁC NHẬN OTP'} <span className="material-symbols-outlined align-middle">check_circle</span></button><div className="text-center text-sm text-on-surface-variant">{secondsLeft > 0 ? `Gửi lại mã sau ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : <button type="button" onClick={handleResendCode} disabled={loading} className="border-0 bg-transparent font-bold text-secondary">Gửi lại mã OTP</button>}</div></form>}

        {step === 3 && <form onSubmit={handleResetPassword} className="flex flex-col gap-5"><div className="relative"><label className="mb-1.5 block font-label-mono text-label-mono text-on-surface-variant" htmlFor="newPassword">Mật khẩu mới</label><input id="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-outline-variant p-3 pr-10 text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 border-0 bg-transparent text-on-surface-variant"><span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div><div className="relative"><label className="mb-1.5 block font-label-mono text-label-mono text-on-surface-variant" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label><input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-outline-variant p-3 pr-10 text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary" required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 border-0 bg-transparent text-on-surface-variant"><span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span></button></div><button type="submit" disabled={loading} className="w-full glossy-btn rounded-full py-3.5 text-white font-bold disabled:opacity-50">{loading ? 'ĐANG LƯU...' : 'ĐỔI MẬT KHẨU'} <span className="material-symbols-outlined align-middle">lock_reset</span></button></form>}

        <div className="text-center mt-2"><Link to="/login" className="text-sm text-secondary font-bold hover:underline">← Quay lại Đăng nhập</Link></div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
