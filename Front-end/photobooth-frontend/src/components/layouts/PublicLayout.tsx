import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dropdown, type MenuProps } from 'antd'
import { message } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'

interface PublicLayoutProps {
  children: React.ReactNode
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, setUser } = useAuthStore()
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null)
  const [avatarResolved, setAvatarResolved] = useState(!isAuthenticated)
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarUrl(null)
      setAvatarResolved(true)
      return
    }

    setAvatarUrl(user?.avatarUrl || null)
    setAvatarResolved(Boolean(user?.avatarUrl))

    let active = true
    void authApi.getMyProfile()
      .then((profile) => {
        if (active) {
          setAvatarUrl(profile.image)
          setAvatarResolved(true)
          const currentUser = useAuthStore.getState().user
          if (currentUser && currentUser.avatarUrl !== profile.image) {
            setUser({ ...currentUser, avatarUrl: profile.image })
          }
        }
      })
      .catch(() => {
        if (active) {
          setAvatarUrl(null)
          setAvatarResolved(true)
        }
      })

    return () => {
      active = false
    }
  }, [isAuthenticated, user?.avatarUrl])

  const scrollToSection = (id: string) => {
    if (!isHome) {
      navigate(`/#${id}`)
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error)
    } finally {
      useAuthStore.getState().logout()
      message.success('Đã đăng xuất')
      navigate('/login')
    }
  }

  const accountMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Trang cá nhân',
      icon: <span className="material-symbols-outlined align-middle mr-2 text-[18px]">person</span>,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-password',
      label: 'Đổi mật khẩu',
      icon: <span className="material-symbols-outlined align-middle mr-2 text-[18px]">lock_reset</span>,
      onClick: () => navigate('/change-password'),
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
      icon: <span className="material-symbols-outlined align-middle mr-2 text-[18px]">logout</span>,
      onClick: handleLogout,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md text-on-background relative overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 bg-surface/80 backdrop-blur-xl rounded-full mt-3 mx-auto max-w-[95%] border border-outline-variant bg-gradient-to-b from-white/40 to-transparent shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        <button onClick={() => navigate('/')} className="font-display-bubble text-2xl md:text-3xl text-secondary drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] cursor-pointer select-none bg-transparent border-0">KH Booth</button>
        <ul className="hidden md:flex gap-5 items-center font-headline-lg text-sm lg:text-base list-none">
          <li onClick={() => isHome ? scrollToSection('hero-section') : navigate('/')} className={`${isHome ? 'text-secondary font-bold border-b-2 border-secondary pb-0.5' : 'text-on-surface-variant font-medium'} cursor-pointer`}>Trang chủ</li>
          <li onClick={() => scrollToSection('features-section')} className="text-on-surface-variant font-medium cursor-pointer">Tính năng</li>
          <li onClick={() => scrollToSection('how-it-works-section')} className="text-on-surface-variant font-medium cursor-pointer">Hướng dẫn</li>
          <li onClick={() => navigate('/about-us')} className={`${location.pathname === '/about-us' ? 'text-secondary font-bold border-b-2 border-secondary pb-0.5' : 'text-on-surface-variant font-medium'} cursor-pointer`}>Về chúng tôi</li>
        </ul>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container/60 rounded-full border border-white/30 shadow-inner font-label-mono text-label-mono">
            <button onClick={() => setLang('VI')} className={`bg-transparent border-0 cursor-pointer ${lang === 'VI' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>VI</button>
            <span className="text-outline">|</span>
            <button onClick={() => setLang('EN')} className={`bg-transparent border-0 cursor-pointer ${lang === 'EN' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>EN</button>
          </div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: accountMenuItems }} trigger={['click']} placement="bottomRight">
              <button className="bg-secondary/10 border border-secondary/30 text-secondary font-headline-lg-mobile px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-secondary/20 transition-colors">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Ảnh đại diện" className="h-7 w-7 rounded-full object-cover" />
                ) : !avatarResolved ? (
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                )}
                {!avatarUrl && avatarResolved && (user?.name || 'Tài khoản')}
              </button>
            </Dropdown>
          ) : (
            <button onClick={() => navigate('/login')} className="hidden lg:block text-primary font-body-md px-3 py-1.5 rounded-full bg-transparent border-0 cursor-pointer">Đăng nhập / Đăng ký</button>
          )}
          <button onClick={() => navigate(isAuthenticated ? '/' : '/login')} className="bg-primary text-on-primary font-headline-lg-mobile px-4 md:px-5 py-1.5 rounded-full cursor-pointer border border-white/50 shadow-md whitespace-nowrap">CHỤP NGAY</button>
        </div>
      </nav>

      <div className="flex-grow">{children}</div>

      <footer className="w-full bg-surface-container-low py-8 px-8 border-t border-white/50 relative z-10 mt-auto">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-display-bubble text-2xl text-secondary">KH Booth</div>
          <div className="flex gap-6 text-on-surface-variant font-medium">
            <button className="bg-transparent border-0 cursor-pointer" onClick={() => navigate('/about-us')}>Về Chúng Tôi</button>
            <button className="bg-transparent border-0 cursor-pointer" onClick={() => scrollToSection('features-section')}>Điều Khoản</button>
            <button className="bg-transparent border-0 cursor-pointer" onClick={() => scrollToSection('how-it-works-section')}>Bảo Mật</button>
          </div>
          <div className="text-outline text-sm">© 2026 Photobooth AI Y2K.</div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout