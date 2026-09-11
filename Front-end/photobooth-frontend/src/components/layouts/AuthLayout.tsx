import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

const AuthLayout: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-on-surface font-body-md overflow-x-hidden flex flex-col justify-center items-center py-10 px-4 relative">
      {/* Background Sparkles */}
      <div className="absolute top-10 left-10 text-secondary y2k-sparkle z-0 pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>
          flare
        </span>
      </div>
      <div
        className="absolute bottom-20 right-10 text-primary-container y2k-sparkle z-0 pointer-events-none"
        style={{ animationDelay: '1s' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1" }}>
          flare
        </span>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-lg z-10 relative">
        {/* Brand Header */}
        <div className="text-center mb-6 cursor-pointer select-none" onClick={() => navigate('/')}>
          <h1 className="font-display-bubble text-4xl md:text-display-bubble text-secondary drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] hover:scale-105 transition-transform">
            KH Booth
          </h1>
          <p className="font-label-mono text-label-mono text-on-surface-variant mt-1 uppercase tracking-widest">
            AI Photobooth Studio
          </p>
        </div>

        {/* Dynamic Auth Page Content */}
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout
