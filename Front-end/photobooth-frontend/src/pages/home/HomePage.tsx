import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import './HomePage.css'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const [sessionCode, setSessionCode] = useState('')

  const handleJoinSession = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!sessionCode.trim()) {
      message.warning('Vui lòng nhập mã phòng chụp!')
      return
    }
    message.success(`Đang tham gia phòng: ${sessionCode.trim().toUpperCase()}`)
    navigate(isAuthenticated ? '/' : '/login')
  }

  const handleStartShooting = () => {
    navigate(isAuthenticated ? '/' : '/login')
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const photos = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDwv1jhAhnycjTXdsehFjfc43uj9HbsutmtAvbrmdNxQEqrWCb6X-lYlqiUMR6BPkUUJBxFo2w3JEcekYJNUwHXdGtiv21WZNiMUgqhA38AbAVL4kHOH3XRYwkbKhRGia3sGTYMLmlQMB5YAXNG9UBZxQp8tWnQBOhgOxRaAOmQHTWaETml1yPBxi4zA9ABG0MRTCtJy8mC7w26UAn6TTFDj4_JA79RRoVL_2T8pDPQSMEhX_XaaWAoMg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAHFSVJUYohV6nmrsrm2FFpPzfXxEIGulLfyP8Ekmbn3HGoaXAxTsJjr0RYPwkqlZfK1wKwj5ILvja6Bc3hAtYH3tNglqsY-VGK2Hkv7RDdA1nNiz2MtuyxDS9w0nsZPu7x1U4WLf-o7UpvWUS7lsogWld0oEY7XQzJALcPYbWOkBR7HWWAMhYAXYlyY8n9qrCmOJ4piZnYxCAXeKCIoSMKRqBTj3XhYnVpEMyhBlSGMOIqjMeFfj6tfg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBlxZPVEVD1mxxzSZdEi4BJWGaReLt2nUM0BlRd0ciE9xX_2LbFrHuzfuASq1-251dAMXF0G8Zg6kRkBerVpFr6hw4q1Gzq6HpLM1tFMpHJAqAsz-Todsmf8LsL-2JflyxKtHk4qW4OWKLRslZllCCaY4Wa2K2lWVNkBCX59DsmZTm5wUP1XnCnvQPTpiRii9UaKWFtG0rj_D7kjVfcHNiIGarqZ8aUIsHOPZwFv8Gab9ELRS0MYHbUtw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCl8EBGO33ADQJB0OfA-Q9Q23hCoRldVZ9qNPf1NKwWugmHX2_gxLIDvhRxdPh9yBQvAoVsrmNlPU5oWnFicxFgVjsjdG1MwJUfgh7yGClnhfHFlGgDHj1UZbpG3JC1AJz813lh6C_EQ-u9vbgCidfmVvIgbYm3dnHgBhO6-_2sKz_cqoTSTQcqEcJPc3lItCZbf85T1jiJvG-QlwyG6tZ5brS82fAjdYgDQYELaDF4sOfefpSWKBx9pg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBuFmBnuH11MLMra2PMgYnkqDxHK_9DisbPslZ_djAzLGjP1Rr9LYCCGIRpVsAdKMesPhcOElbRUQ3B8jBnqGxUxpCMudwWgl5AGmA-OkPZ2HdegLck0azjFI4vC_yQk1HAh2ThRr1PUtGxlCDEpY1IZRQITJB21ZPnH5Qb2gCiXgx0hK9akFJ26ryR0Wc6tJ2_vqOUXmZmgk8G8xVuvEw1UVZy-Ajv2yo8Hardc8N7gkvg_wM0hs7lGw',
  ]

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md text-on-background relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <span className="material-symbols-outlined absolute top-[20%] left-[10%] text-secondary/50" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>flare</span>
        <span className="material-symbols-outlined absolute top-[60%] right-[15%] text-primary-fixed-dim/60" style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>flare</span>
        <span className="material-symbols-outlined absolute bottom-[20%] left-[25%] text-secondary-fixed-dim/40" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>flare</span>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-3 bg-surface/80 backdrop-blur-xl rounded-full mt-4 mx-auto max-w-[95%] border border-outline-variant bg-gradient-to-b from-white/40 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <button onClick={() => navigate('/')} className="font-display-bubble text-3xl md:text-display-bubble text-secondary drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] cursor-pointer select-none bg-transparent border-0">KH Booth</button>
        <ul className="hidden md:flex gap-8 items-center font-headline-lg text-lg lg:text-headline-lg list-none">
          <li onClick={() => scrollToSection('hero-section')} className="text-secondary font-bold border-b-2 border-secondary pb-1 cursor-pointer">Trang chủ</li>
          <li onClick={() => scrollToSection('features-section')} className="text-on-surface-variant font-medium cursor-pointer">Tính năng</li>
          <li onClick={() => scrollToSection('how-it-works-section')} className="text-on-surface-variant font-medium cursor-pointer">Hướng dẫn</li>
        </ul>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-surface-container/60 rounded-full border border-white/30 shadow-inner font-label-mono text-label-mono">
            <button onClick={() => setLang('VI')} className={`bg-transparent border-0 cursor-pointer ${lang === 'VI' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>VI</button>
            <span className="text-outline">|</span>
            <button onClick={() => setLang('EN')} className={`bg-transparent border-0 cursor-pointer ${lang === 'EN' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>EN</button>
          </div>
          {isAuthenticated ? <button onClick={() => navigate('/profile')} className="bg-secondary/10 border border-secondary/30 text-secondary font-headline-lg-mobile px-4 py-2 rounded-full flex items-center gap-2"><span className="material-symbols-outlined text-xl">account_circle</span>{user?.name || 'Tài khoản'}</button> : <button onClick={() => navigate('/login')} className="hidden lg:block text-primary font-body-md px-4 py-2 rounded-full bg-transparent border-0 cursor-pointer">Đăng nhập / Đăng ký</button>}
          <button onClick={handleStartShooting} className="bg-primary text-on-primary font-headline-lg-mobile px-5 md:px-6 py-2 rounded-full cursor-pointer border border-white/50 shadow-md whitespace-nowrap">CHỤP NGAY</button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-start pt-32 pb-16 w-full max-w-container-max mx-auto z-10 relative">
        <section id="hero-section" className="text-center mb-12 flex flex-col items-center px-4 md:px-margin-desktop">
          <button onClick={handleStartShooting} className="btn-glossy group relative overflow-hidden bg-gradient-to-b from-primary-fixed to-primary-container rounded-full px-8 md:px-12 py-5 md:py-6 flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-white/40 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent h-1/2 rounded-t-full pointer-events-none" />
            <span className="material-symbols-outlined text-primary text-[32px] md:text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
            <span className="font-headline-lg text-2xl md:text-headline-lg text-on-primary-container tracking-tight">BẮT ĐẦU CHỤP</span>
          </button>
        </section>

        <form onSubmit={handleJoinSession} className="w-full max-w-md bg-surface-container/60 backdrop-blur-2xl rounded-2xl p-6 border-2 border-white/50 shadow-[4px_0_15px_rgba(0,0,0,0.05)] flex flex-col gap-4 mb-16 relative mx-4">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-white/40 to-surface-variant/20 rounded-t-xl border-b border-white/30 flex items-center px-3 gap-2"><div className="w-2.5 h-2.5 rounded-full bg-outline-variant" /><div className="w-2.5 h-2.5 rounded-full bg-outline-variant" /></div>
          <label className="font-label-mono text-label-mono text-on-surface-variant uppercase mt-4 tracking-widest pl-2">Join a Session</label>
          <div className="flex gap-2"><input value={sessionCode} onChange={(event) => setSessionCode(event.target.value)} className="w-full bg-surface-container-low border-none rounded-full py-3 px-6 text-on-surface outline-none" placeholder="Nhập Mã Phòng Chụp" type="text" /><button type="submit" className="bg-gradient-to-r from-secondary-fixed to-secondary-fixed-dim text-on-secondary-container font-headline-lg-mobile px-6 py-3 rounded-full border border-white/50 whitespace-nowrap">Tham Gia</button></div>
        </form>

        <div className="w-full film-strip-container mt-4 mb-28 px-4"><div className="film-strip-inner w-full max-w-4xl mx-auto py-8">
          {photos.map((photo, index) => <div key={photo} className={`film-card bg-white p-3 pb-10 shadow-2xl border border-surface-variant rounded-sm flex-shrink-0 ${index === 2 ? 'w-48 md:w-56 mt-[-40px]' : 'w-44 md:w-48'} ${index === 1 || index === 3 ? 'mt-[-20px]' : ''}`}><div className={`${index === 2 ? 'h-60 md:h-64' : 'h-52 md:h-56'} w-full bg-cover bg-center bg-surface-container-highest`} style={{ backgroundImage: `url('${photo}')` }} /></div>)}
        </div></div>

        <section id="features-section" className="w-full px-4 md:px-margin-desktop mb-28 flex flex-col items-center"><h2 className="font-display-bubble text-3xl md:text-display-bubble text-secondary drop-shadow-md mb-12 text-center">TÍNH NĂNG NỔI BẬT</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[['auto_awesome', 'AI Filter Magic', 'Biến hình phong cách Y2K với các bộ lọc AI siêu thực, chuẩn vibe năm 2000s.'], ['groups', 'Real-time Group', 'Chụp cùng bạn bè trong phòng ảo theo thời gian thực, tương tác cực vui.'], ['download', 'Instant Download', 'Tải ảnh cực nhanh với độ phân giải cao, sẵn sàng khoe lên mạng xã hội.']].map(([icon, title, text]) => <article key={title} className="silver-card rounded-2xl p-8 flex flex-col items-center text-center gap-4"><div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary-fixed to-primary-fixed flex items-center justify-center shadow-inner border border-white"><span className="material-symbols-outlined text-secondary text-3xl">{icon}</span></div><h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{title}</h3><p className="text-on-surface-variant">{text}</p></article>)}
        </div></section>

        <section id="how-it-works-section" className="w-full px-4 md:px-margin-desktop mb-24 flex flex-col items-center"><h2 className="font-display-bubble text-3xl md:text-display-bubble text-on-surface drop-shadow-sm mb-16 text-center">CÁCH HOẠT ĐỘNG</h2><div className="flex flex-col md:flex-row gap-12 w-full max-w-4xl relative">
          {['Chọn Chế Độ', 'Chỉnh Style', 'Nhận Ảnh Xịn'].map((title, index) => <div key={title} className="flex-1 flex flex-col items-center text-center z-10"><div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-display-bubble text-3xl shadow-lg border-4 border-surface mb-6">{index + 1}</div><h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">{title}</h3><p className="text-on-surface-variant">{['Tạo phòng chụp đơn hoặc mời bạn bè tham gia cùng lúc.', 'Áp dụng các filter Y2K cực chất và tùy chỉnh sticker.', 'Lưu ảnh về máy nhanh chóng và khoe với mọi người.'][index]}</p></div>)}
        </div></section>
      </main>
      <footer className="w-full bg-surface-container-low py-8 px-8 border-t border-white/50 relative z-10 mt-auto"><div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4"><div className="font-display-bubble text-2xl text-secondary">KH Booth</div><div className="flex gap-6 text-on-surface-variant font-medium"><button className="bg-transparent border-0 cursor-pointer" onClick={() => scrollToSection('hero-section')}>Về Chúng Tôi</button><button className="bg-transparent border-0 cursor-pointer" onClick={() => scrollToSection('features-section')}>Điều Khoản</button><button className="bg-transparent border-0 cursor-pointer" onClick={() => scrollToSection('how-it-works-section')}>Bảo Mật</button></div><div className="text-outline text-sm">© 2026 Photobooth AI Y2K.</div></div></footer>
    </div>
  )
}

export default HomePage
