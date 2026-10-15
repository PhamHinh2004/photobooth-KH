import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

const UserGuard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  return <Outlet />
}

export default UserGuard
