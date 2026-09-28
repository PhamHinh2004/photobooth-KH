import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const processOAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const accessToken = params.get('accessToken')

      if (accessToken) {
        try {
          // Temporarily store access token in localStorage for authApi to use
          localStorage.setItem('accessToken', accessToken)
          
          // Fetch user info using the token
          const user = await authApi.getMe()
          
          if (user) {
            setAuth(user, accessToken)
            message.success('Đăng nhập thành công!')
            navigate(user.role?.toLowerCase() === 'admin' ? '/admin' : '/', { replace: true })
          } else {
            throw new Error('Không lấy được thông tin người dùng')
          }
        } catch (error) {
          console.error(error)
          setErrorMsg('Đăng nhập thất bại, vui lòng thử lại sau.')
          localStorage.removeItem('accessToken') // cleanup
          setTimeout(() => navigate('/login', { replace: true }), 3000)
        }
      } else {
        setErrorMsg('Không tìm thấy Access Token')
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      }
    }

    processOAuth()
  }, [navigate, setAuth])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {errorMsg ? (
        <div className="text-error">{errorMsg}</div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-secondary font-medium">Đang xác thực đăng nhập...</p>
        </div>
      )}
    </div>
  )
}

export default OAuthCallbackPage
