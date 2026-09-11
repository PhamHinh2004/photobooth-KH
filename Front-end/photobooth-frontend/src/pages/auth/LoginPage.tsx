import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      message.warning('Vui lòng nhập Email hoặc SĐT!')
      return
    }
    if (!password) {
      message.warning('Vui lòng nhập Mật khẩu!')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.login({ email, password })
      setAuth(response.user, response.accessToken)
      message.success('Đăng nhập thành công!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } } }
      const apiMessage = axiosError.response?.data?.message
      const messageText = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage
      const fallbackMessage = 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin'
      setErrorMsg(messageText || fallbackMessage)
      message.error(messageText || fallbackMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'Google' | 'Facebook') => {
    message.loading({ content: `Đang kết nối tới ${provider}...`, key: 'social' })
    setTimeout(() => {
      // Giả lập Đăng nhập Social
      const dummyUser = {
        id: '1',
        email: provider === 'Google' ? 'user.google@gmail.com' : 'user.facebook@fb.com',
        name: provider === 'Google' ? 'Google User' : 'Facebook User',
      }
      setAuth(dummyUser, 'social_access_token_demo')
      message.success({ content: `Đăng nhập bằng ${provider} thành công!`, key: 'social' })
      navigate('/dashboard')
    }, 1200)
  }

  return (
    <div className="bg-surface/60 backdrop-blur-2xl rounded-xl p-6 md:p-8 chrome-border relative overflow-hidden shadow-2xl">
      {/* Window Title Bar */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-surface-variant to-white/50 border-b border-white/80 flex items-center px-4 justify-between">
        <span className="font-label-mono text-[10px] text-tertiary">Login.exe</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-outline-variant shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-outline-variant shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-error shadow-inner"></div>
        </div>
      </div>

      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="text-center mb-1">
          <h2 className="font-headline-lg text-2xl text-secondary">Chào mừng trở lại!</h2>
          <p className="text-sm text-on-surface-variant">Đăng nhập tài khoản Photobooth AI của bạn</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-error-container/30 border border-error text-error text-xs font-label-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email / Username */}
        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="loginEmail">
            Email hoặc Số điện thoại
          </label>
          <div className="relative">
            <input
              id="loginEmail"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMsg(null)
              }}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-outline-variant p-3 font-body-md text-body-md text-on-surface input-inset focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all pr-10"
              required
            />
            <span className="material-symbols-outlined absolute right-3 top-3.5 text-outline text-lg">person</span>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1.5" htmlFor="loginPassword">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="loginPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-secondary rounded border-outline-variant focus:ring-secondary"
            />
            <span className="text-on-surface-variant font-medium">Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="text-secondary font-bold hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full glossy-btn rounded-full py-3.5 px-6 font-headline-lg-mobile text-headline-lg-mobile text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 border border-white/50 shadow-lg cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}</span>
          <span className="material-symbols-outlined">login</span>
        </button>

        {/* Social Login Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-[1px] bg-outline-variant/50"></div>
          <span className="font-label-mono text-[11px] text-tertiary uppercase tracking-wider">Hoặc đăng nhập bằng</span>
          <div className="flex-1 h-[1px] bg-outline-variant/50"></div>
        </div>

        {/* Social Login Buttons (Google & Facebook) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Google (Gmail) Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/80 hover:bg-white border border-outline-variant/60 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer font-medium text-xs text-on-surface"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer font-medium text-xs"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        {/* Redirect link */}
        <div className="text-center mt-3">
          <span className="text-sm text-on-surface-variant">Chưa có tài khoản? </span>
          <Link to="/register" className="text-sm text-secondary font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  )
}

export default LoginPage
