import { useState } from 'react'
import type { PackageOption } from '@/types/capture.types'
import frameOptions from '@/data/frame_options.json'

export const PACKAGE_OPTIONS: PackageOption[] = frameOptions as PackageOption[]

interface PackageSelectorProps {
  onSelectPackage: (option: PackageOption) => void
}

export default function PackageSelector({ onSelectPackage }: PackageSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(PACKAGE_OPTIONS[0].id)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = [
    { key: 'all', label: 'Tất cả gói' },
    { key: 'strip', label: 'Strip Dài (1x4)' },
    { key: 'grid', label: 'Khung Vuông / Đôi' },
    { key: 'large', label: 'Khung Lớn (6 ảnh)' },
  ]

  const filteredPackages = activeCategory === 'all'
    ? PACKAGE_OPTIONS
    : PACKAGE_OPTIONS.filter((p) => p.category === activeCategory)

  const selectedoption = PACKAGE_OPTIONS.find((p) => p.id === selectedId) || PACKAGE_OPTIONS[0]

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(233,69,96,0.3)]">
          <span>✨ CHỌN BỐ CỤC KHUNG ÁNH</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
          Bước 1: Chọn Kích Thước & Dạng Gói Chụp
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
          Chọn kiểu khung ảnh photobooth bạn mong muốn. Tải hoặc in thành phẩm sẽ đúng chuẩn bố cục này.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 ${
              activeCategory === cat.key
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-[0_0_20px_rgba(233,69,96,0.5)] scale-105'
                : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Cards + Live Mockup Preview Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        {/* Left 7 columns: Package Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPackages.map((option) => {
            const isSelected = option.id === selectedId
            return (
              <div
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`relative cursor-pointer rounded-3xl p-5 transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-slate-900/80 border-pink-500 shadow-[0_0_30px_rgba(233,69,96,0.4)] scale-[1.02] ring-2 ring-pink-500/50'
                    : 'bg-slate-900/40 border-white/10 hover:border-pink-500/40 hover:bg-white/10'
                }`}
              >
                {/* Popular Badge */}
                {option.isPopular && (
                  <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 uppercase tracking-wider shadow-lg animate-pulse">
                    🔥 ĐƯỢC YÊU THÍCH NHẤT
                  </span>
                )}

                <div>
                  {/* Top Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                      {option.icon}
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500 text-white shadow-md'
                          : 'border-white/30 bg-white/5'
                      }`}
                    >
                      {isSelected && <span className="text-xs font-black">✓</span>}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1 tracking-tight">{option.title}</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-4">{option.subtitle}</p>
                </div>

                {/* Bottom Tags */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10 text-[11px] font-semibold">
                  <span className="bg-white/10 text-white/90 px-2.5 py-1 rounded-xl border border-white/10">
                    📏 {option.dimensions}
                  </span>
                  <span className="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-xl border border-pink-500/30">
                    🖼️ {option.slotsCount} ô ảnh
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right 5 columns: Live Interactive Print Paper Mockup */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              Xem Trước Dạng In Thực Tế
            </span>
            <h4 className="text-base font-extrabold text-white mt-0.5">
              {selectedoption.title}
            </h4>
          </div>

          {/* Paper Print Graphic Mockup */}
          <div className="relative bg-white text-slate-900 rounded-2xl p-4 shadow-[0_0_40px_rgba(255,255,255,0.15)] border-4 border-slate-200 transition-all duration-500 flex flex-col items-center w-full max-w-[220px]">
            {/* Header branding simulation */}
            <div className="w-full text-center pb-2 mb-2 border-b border-slate-200">
              <span className="text-[10px] font-black tracking-tighter text-slate-800 uppercase">
                KH PHOTOBOOTH • {selectedoption.dimensions}
              </span>
            </div>

            {/* Layout Slot Previews based on selected package */}
            {(() => {
              const renderSlot = (i: number, aspect: string = 'aspect-square') => (
                <div
                  key={i}
                  className={`w-full ${aspect} rounded-sm bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold`}
                >
                  {i + 1}
                </div>
              )

              switch (selectedoption.id) {
                case '2x2':
                  return (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      {Array.from({ length: 4 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '1x4':
                  return (
                    <div className="flex flex-col gap-1.5 w-full">
                      {Array.from({ length: 4 }).map((_, i) => renderSlot(i, 'aspect-[4/3]'))}
                    </div>
                  )
                case '3x2':
                  return (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      {Array.from({ length: 6 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '2x3':
                  return (
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      {Array.from({ length: 6 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '4x2':
                  return (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      {Array.from({ length: 8 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '2x4':
                  return (
                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {Array.from({ length: 8 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                default:
                  return null
              }
            })()}

            {/* Footer paper watermark */}
            <div className="mt-3 text-center text-[8px] font-semibold text-slate-400 uppercase tracking-widest">
              MEMORIES FOR EVER
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-pink-400 font-bold text-xs bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
              Số lượt chụp: {selectedoption.shotsCount} ảnh liên tiếp
            </span>
          </div>
        </div>
      </div>

      {/* Main Confirm Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => onSelectPackage(selectedoption)}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black text-base md:text-lg shadow-[0_0_35px_rgba(233,69,96,0.6)] hover:shadow-[0_0_50px_rgba(233,69,96,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
        >
          <span>XÁC NHẬN CHỌN GÓI NÀY</span>
          <span className="text-xl">➔</span>
        </button>
      </div>
    </div>
  )
}
