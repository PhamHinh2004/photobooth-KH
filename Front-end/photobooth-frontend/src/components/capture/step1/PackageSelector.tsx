import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PackageOption } from '@/types/capture.types'
import frameOptions from '@/data/frame_options.json'

export const PACKAGE_OPTIONS: PackageOption[] = frameOptions as PackageOption[]

interface PackageSelectorProps {
  onSelectPackage: (option: PackageOption) => void
}

export default function PackageSelector({ onSelectPackage }: PackageSelectorProps) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>(PACKAGE_OPTIONS[0].id)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = [
    { key: 'all', label: 'Tất cả gói' },
    { key: 'strip', label: 'Strip Dải Dài (1x4, 2x2)' },
    { key: 'grid', label: 'Khung Vuông / Đôi' },
    { key: 'large', label: 'Khung Lớn (8 ảnh)' },
  ]

  const filteredPackages = PACKAGE_OPTIONS.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.subtitle.toLowerCase().includes(query) ||
      p.dimensions.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  const selectedoption = PACKAGE_OPTIONS.find((p) => p.id === selectedId) || PACKAGE_OPTIONS[0]

  const getOrientationLabel = (option: PackageOption) => {
    if ((option as any).orientation === 'vertical' || option.id === '1x4' || option.id === '2x3' || option.id === '2x4') {
      return 'KÍCH THƯỚC: CHIỀU DỌC'
    }
    if ((option as any).orientation === 'horizontal' || option.id === '3x2' || option.id === '4x2') {
      return 'KÍCH THƯỚC: CHIỀU NGANG'
    }
    return 'KÍCH THƯỚC: CÂN BẰNG'
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-24">
      {/* ── Title Header matching Figma Hình 1 ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-200/60 text-[#c026d3] text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-[#FF00FF]">✦</span> SOLO PHOTOBOOTH EXPERIENCE
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-[#d946ef] via-[#9333ea] to-[#2563eb] bg-clip-text text-transparent">
              Bước 1: Chọn Kích Thước Frame
            </span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm max-w-xl leading-relaxed">
            Tìm kiếm và lựa chọn mẫu bố cục khung hình phù hợp cho buổi chụp đơn của bạn. Hỗ trợ xuất ảnh in Kiosk tự động &amp; video Motion Live Y2K.
          </p>
        </div>

        {/* Search input matching Hình 1 */}
        <div className="relative w-full md:w-80 flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Gõ tìm kiếm size (vd: 4x6, 2x3)..."
            className="w-full bg-white/90 backdrop-blur-sm border border-[#E5E4E2] focus:border-[#89CFF0] rounded-full px-5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#89CFF0]/30 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 ${isActive
                ? 'bg-gradient-to-r from-[#d946ef] to-[#9333ea] text-white shadow-md shadow-fuchsia-500/20 scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900 border border-[#E5E4E2]'
                }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Main Grid: Cards + Live Mockup Preview Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        {/* Left 7 cols: Package Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPackages.map((option) => {
            const isSelected = option.id === selectedId
            const isPopular = (option as any).isPopular || option.id === '2x2' || option.id === '1x4'
            const orientationText = getOrientationLabel(option)

            return (
              <div
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`relative cursor-pointer rounded-3xl p-5 transition-all duration-300 border flex flex-col justify-between ${isSelected
                  ? 'bg-[#e0f4fc] border-[#89CFF0] shadow-[0_4px_24px_rgba(137,207,240,0.4)] scale-[1.02] ring-2 ring-[#89CFF0]/40'
                  : 'bg-white border-[#E5E4E2] hover:border-[#89CFF0]/60 hover:shadow-md'
                  }`}
              >
                {/* Popular Badge & Checkmark */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#9333ea]' : 'text-gray-400'
                      }`}
                  >
                    {orientationText}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF00FF] to-[#c026d3] text-white uppercase tracking-wider shadow-sm">
                        PHỔ BIẾN
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#9333ea] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                        ✓
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black text-gray-900 mb-0.5 tracking-tight">
                    {option.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    {option.subtitle}
                  </p>
                </div>

                {/* Card Layout Miniature Preview */}
                <div className="bg-[#f0f0f2] rounded-xl p-3 mb-4 flex items-center justify-center min-h-[90px]">
                  {option.id === '1x4' ? (
                    <div className="flex flex-col gap-1 w-10">
                      <div className="w-full h-3.5 bg-gray-400/70 rounded-xs" />
                      <div className="w-full h-3.5 bg-gray-400/70 rounded-xs" />
                      <div className="w-full h-3.5 bg-gray-400/70 rounded-xs" />
                      <div className="w-full h-3.5 bg-gray-400/70 rounded-xs" />
                    </div>
                  ) : option.id === '2x2' ? (
                    <div className="grid grid-cols-2 gap-1.5 w-16">
                      <div className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      <div className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      <div className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      <div className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                    </div>
                  ) : option.id === '3x2' ? (
                    <div className="grid grid-cols-3 gap-1 w-20">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      ))}
                    </div>
                  ) : option.id === '2x3' ? (
                    <div className="grid grid-cols-2 gap-1 w-14">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      ))}
                    </div>
                  ) : option.id === '4x2' ? (
                    <div className="grid grid-cols-4 gap-1 w-24">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      ))}
                    </div>
                  ) : option.id === '2x4' ? (
                    <div className="grid grid-cols-2 gap-1 w-12">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 w-12">
                      {Array.from({ length: option.slotsCount }).map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-gray-400/70 rounded-xs" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Tags */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>🖼️</span> {option.dimensions}
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-[#E5E4E2] text-gray-700 font-bold">
                    {option.shotsCount} Shots
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right 5 cols: Live Interactive Print Paper Mockup */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-sm border border-[#E5E4E2] rounded-3xl p-6 shadow-sm flex flex-col items-center sticky top-24">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Xem Trước Dạng In Thực Tế
            </span>
            <h4 className="text-base font-extrabold text-gray-900 mt-0.5">
              {selectedoption.title}
            </h4>
          </div>

          {/* Paper Print Graphic Mockup */}
          <div className="relative bg-white text-slate-900 rounded-2xl p-4 shadow-xl border-4 border-[#E5E4E2] transition-all duration-500 flex flex-col items-center w-full max-w-[220px]">
            {/* Header branding */}
            <div className="w-full text-center pb-2 mb-2 border-b border-gray-200">
              <span className="text-[10px] font-black tracking-tighter text-gray-700 uppercase">
                KH PHOTOBOOTH • {selectedoption.dimensions}
              </span>
            </div>

            {/* Layout Slot Previews */}
            {(() => {
              const renderSlot = (i: number, aspect: string = 'aspect-square') => (
                <div
                  key={i}
                  className={`w-full ${aspect} rounded-sm bg-gray-200/90 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 font-bold`}
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
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      {Array.from({ length: 6 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '2x3':
                  return (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      {Array.from({ length: 6 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '4x2':
                  return (
                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {Array.from({ length: 8 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                case '2x4':
                  return (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      {Array.from({ length: 8 }).map((_, i) => renderSlot(i))}
                    </div>
                  )
                default:
                  return null
              }
            })()}

            {/* Footer */}
            <div className="mt-3 text-center text-[8px] font-semibold text-gray-400 uppercase tracking-widest">
              MEMORIES FOR EVER
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[#c026d3] font-bold text-xs bg-fuchsia-50 px-3.5 py-1.5 rounded-full border border-fuchsia-200">
              Số lượt chụp: {selectedoption.shotsCount} ảnh liên tiếp
            </span>
          </div>
        </div>
      </div>

      {/* ── FLOATING BOTTOM SUMMARY BAR (Hình 2 trong Figma) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-[#E5E4E2] flex items-center justify-between gap-3 md:gap-6">
          {/* Left: Back to Home button */}
          <button
            onClick={() => navigate('/')}
            className="px-4 md:px-5 py-2.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-gray-700 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>←</span>
            <span>Quay lại Trang Chủ</span>
          </button>

          {/* Center: Selected package info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-fuchsia-100 border border-fuchsia-200 text-[#c026d3] flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-5 h-5 text-[#c026d3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                LỰA CHỌN CỦA BẠN
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-900 truncate">
                <span>{selectedoption.title}</span>
                <span className="mx-1 text-gray-300">•</span>
                <span className="text-[#d946ef] font-bold">{selectedoption.shotsCount || selectedoption.slotsCount} ảnh</span>
                <span className="text-gray-500 font-normal hidden sm:inline ml-1">({selectedoption.subtitle})</span>
              </div>
            </div>
          </div>

          {/* Right: Continue button */}
          <button
            onClick={() => onSelectPackage(selectedoption)}
            className="px-6 md:px-8 py-3 rounded-full bg-gradient-to-r from-[#d946ef] via-[#a855f7] to-[#4f86a8] hover:opacity-95 text-white font-bold text-xs md:text-sm shadow-[0_4px_20px_rgba(217,70,239,0.35)] hover:shadow-[0_6px_25px_rgba(217,70,239,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            <span>Tiếp Tục: Chọn Style (Bước 2)</span>
            <span className="text-base">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
