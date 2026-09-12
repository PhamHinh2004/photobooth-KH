import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

const vietnamesePhonePattern = /^(0(3|5|7|8|9)\d{8}|\+84(3|5|7|8|9)\d{8})$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0)
  const [otpLoading, setOtpLoading] = useState(false)

  useEffect(() => {
    if (!showOtp || otpSecondsLeft <= 0) return
    const timer = window.setInterval(() => setOtpSecondsLeft((seconds) => Math.max(seconds - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [showOtp, otpSecondsLeft])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    if (!fullName.trim()) {
      message.warning('Vui lòng nhập họ và tên!')
      return
    }
    if (!emailPattern.test(email.trim())) {
      setErrorMsg('Email đăng nhập không đúng định dạng.')
      return
    }
    if (!vietnamesePhonePattern.test(phone.trim())) {
      setErrorMsg('Số điện thoại không đúng định dạng đầu số Việt Nam.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      })
      setShowOtp(true)
      setOtpSecondsLeft(120)
      message.success(response.message)
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } } }
      const apiMessage = axiosError.response?.data?.message
      const displayMessage = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage
      const fallbackMessage = axiosError.response
        ? 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin.'
        : 'Không thể kết nối máy chủ. Hãy khởi động backend và kiểm tra cấu hình Neon.'
      setErrorMsg(displayMessage || fallbackMessage)
      message.error(displayMessage || fallbackMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số OTP.')
      return
    }
    setOtpLoading(true)
    try {
      const response = await authApi.verifyRegistrationOtp({ email: email.trim().toLowerCase(), otp })
      setAuth(response.user, response.accessToken)
      message.success('Xác thực email và đăng ký thành công!')
      navigate('/', { replace: true })
    } catch (error: unknown) {
      const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      setErrorMsg(apiMessage || 'OTP không hợp lệ hoặc đã hết hạn.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setOtpLoading(true)
    try {
      const response = await authApi.resendRegistrationOtp({ fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password })
      setOtp('')
      setOtpSecondsLeft(120)
      setErrorMsg(null)
      message.success(response.message)
    } catch (error: unknown) {
      const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      setErrorMsg(apiMessage || 'Không thể gửi lại OTP.')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <>
    <div className="bg-surface/60 backdrop-blur-2xl rounded-xl p-6 md:p-8 chrome-border relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-surface-variant to-white/50 border-b border-white/80 flex items-center px-4 justify-between">
        <span className="font-label-mono text-[10px] text-tertiary">Registration.exe</span>
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-outline-variant" /><div className="w-3 h-3 rounded-full bg-outline-variant" /><div className="w-3 h-3 rounded-full bg-error" /></div>
      </div>

      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="text-center mb-2">
          <h2 className="font-headline-lg text-2xl text-secondary">Tạo tài khoản mới</h2>
          <p className="text-sm text-on-surface-variant">Điền thông tin để trải nghiệm Photobooth AI</p>
        </div>

        {errorMsg && <div className="p-3 rounded-lg bg-error-container/30 border border-error text-error text-xs font-label-mono flex items-center gap-2"><span className="material-symbols-outlined text-sm">warning</span><span>{errorMsg}</span></div>}

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="fullName">Họ và tên</label>
          <input id="fullName" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Văn A" className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all" autoComplete="name" required />
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="registerEmail">Email đăng nhập</label>
          <input id="registerEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all" autoComplete="email" required />
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="registerPhone">Số điện thoại</label>
          <input id="registerPhone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, ''))} placeholder="0987654321" className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all" autoComplete="tel" required />        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="registerPassword">Mật khẩu</label>
          <div className="relative"><input id="registerPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 6 ký tự" className="w-full rounded-lg border border-outline-variant p-3 pr-10 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all" autoComplete="new-password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-on-surface-variant"><span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div>
        </div>

        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
          <div className="relative"><input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" className="w-full rounded-lg border border-outline-variant p-3 pr-10 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary transition-all" autoComplete="new-password" required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-on-surface-variant"><span className="material-symbols-outlined text-lg">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span></button></div>
        </div>

        <button type="submit" disabled={loading} className="mt-2 w-full glossy-btn rounded-full py-3.5 px-6 font-headline-lg-mobile text-headline-lg-mobile text-white flex justify-center items-center gap-2 border border-white/50 shadow-lg cursor-pointer disabled:opacity-50"><span>{loading ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ'}</span><span className="material-symbols-outlined">arrow_forward</span></button>

        <div className="text-center mt-2"><span className="text-sm text-on-surface-variant">Đã có tài khoản? </span><Link to="/login" className="text-sm text-secondary font-bold hover:underline">Đăng nhập</Link></div>
      </form>
    </div>
    {showOtp && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-xl bg-surface p-8 shadow-2xl"><h2 className="mb-2 text-center font-headline-lg text-2xl text-secondary">Xác thực email</h2><p className="mb-5 text-center text-sm text-on-surface-variant">Nhập mã OTP đã gửi tới <strong>{email}</strong>. Mã có hiệu lực trong 2 phút.</p><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="000000" className="mb-4 w-full rounded-lg border border-outline-variant p-3 text-center text-2xl tracking-[0.4em] text-on-surface" />{errorMsg && <p className="mb-3 text-center text-sm text-error">{errorMsg}</p>}<button type="button" disabled={otpLoading} onClick={handleVerifyOtp} className="w-full rounded-full bg-secondary py-3 font-bold text-white disabled:opacity-50">{otpLoading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN OTP'}</button><div className="mt-4 text-center text-sm text-on-surface-variant">{otpSecondsLeft > 0 ? <span>Gửi lại sau {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, '0')}</span> : <button type="button" onClick={handleResendOtp} disabled={otpLoading} className="border-0 bg-transparent font-bold text-secondary">Gửi lại mã OTP</button>}</div><button type="button" onClick={() => setShowOtp(false)} className="mt-3 w-full border-0 bg-transparent text-sm text-on-surface-variant">Đóng</button></div></div>}
    </>
  )
}

export default RegisterPage
