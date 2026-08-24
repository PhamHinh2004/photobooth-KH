import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card-wrapper">
        {/* Logo & Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <h1 className="auth-brand-name">Photobooth KH</h1>
          <p className="auth-brand-tagline">Khoảnh khắc đẹp, mãi mãi lưu giữ</p>
        </div>

        {/* Form Card */}
        <div className="auth-card">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
