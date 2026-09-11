import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'

type OtpValues = [string, string, string, string]

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()

  // Steps: 1 = Enter Email/Phone, 2 = Enter OTP, 3 = Reset Password
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [contact, setContact] = useState('')
  const [otpValues, setOtpValues] = useState<OtpValues>(['', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Step 1: Send Reset Code
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact.trim()) {
      message.warning('Vui lòng nhập Email hoặc Số điện thoại!')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success(`Mã xác thực đã được gửi tới: ${contact}`)
      setStep(2)
    }, 800)
  }

  // Step 2: Verify OTP
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    const newOtp: OtpValues = [...otpValues]
    newOtp[index] = value
    setOtpValues(newOtp)

    if (value && index < 3) {
      otpRefs[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpValues.join('')
    if (code.length < 4) {
      message.warning('Vui lòng nhập đủ 4 chữ số OTP!')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('Xác thực OTP thành công!')
      setStep(3)
    }, 600)
  }

  // Step 3: Change Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      message.warning('Mật khẩu mới tối thiểu 6 ký tự!')
      return
    }
    if (newPassword !== confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      navigate('/login')
    }, 800)
  }

  return (
    <div className="bg-surface/60 backdrop-blur-2xl rounded-xl p-6 md:p-8 chrome-border relative overflow-hidden shadow-2xl">
      {/* Window Title Bar */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-surface-variant to-white/50 border-b border-white/80 flex items-center px-4 justify-between">
        <span className="font-label-mono text-[10px] text-tertiary">ResetPassword.exe</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-outline-variant shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-outline-variant shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-error shadow-inner"></div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <div className="text-center mb-2">
          <h2 className="font-headline-lg text-2xl text-secondary">Quên mật khẩu?</h2>
          <p className="text-sm text-on-surface-variant">
            {step === 1 && 'Nhập thông tin tài khoản để nhận mã khôi phục'}
            {step === 2 && `Nhập mã OTP vừa gửi tới ${contact}`}
            {step === 3 && 'Nhập mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {/* STEP 1: Enter Email / Phone */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-5">
            <div>
              <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="contact">
                Email hoặc Số điện thoại
              </label>
              <div className="relative">
                <input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Nhập email hoặc SĐT đăng ký"
                  className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all pr-10"
                  required
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-outline text-lg">contact_mail</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full glossy-btn rounded-full py-3.5 px-6 font-headline-lg-mobile text-headline-lg-mobile text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 border border-white/50 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'ĐANG GỬI MÃ...' : 'GỬI MÃ KHÔI PHỤC'}</span>
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="flex justify-center gap-3 my-4">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-12 h-14 text-center rounded-lg border border-outline-variant font-headline-lg text-headline-lg text-on-surface input-inset focus:ring-2 focus:ring-secondary focus:border-secondary outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-on-secondary rounded-full py-3.5 px-6 font-headline-lg-mobile text-headline-lg-mobile hover:bg-secondary-container transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2"
            >
              <span>{loading ? 'ĐANG XÁC NHẬN...' : 'XÁC NHẬN OTP'}</span>
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div>
              <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="newPassword">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-on-surface-variant hover:text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full glossy-btn rounded-full py-3.5 px-6 font-headline-lg-mobile text-headline-lg-mobile text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 border border-white/50 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'ĐANG LƯU...' : 'ĐỔI MẬT KHẨU'}</span>
              <span className="material-symbols-outlined">lock_reset</span>
            </button>
          </form>
        )}

        {/* Back to Login link */}
        <div className="text-center mt-2">
          <Link to="/login" className="text-sm text-secondary font-bold hover:underline flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
