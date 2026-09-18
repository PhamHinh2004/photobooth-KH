import { useState } from 'react'
import type { PackageOption } from '@/types/capture.types'

export const PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'strip-1x4',
    title: 'Strip Dải Dài (1x4)',
    subtitle: 'Mẫu photobooth truyền thống dạng dải 4 ảnh',
    slotsCount: 4,
    shotsCount: 4,
    dimensions: '5 x 15 cm',
    icon: '🎞️',
    category: 'strip',
    isPopular: true,
  },
  {
    id: 'strip-2x2',
    title: 'Strip Khung Ô (2x2)',
    subtitle: 'Thiết kế vuông 4 ô ảnh hiện đại',
    slotsCount: 4,
    shotsCount: 4,
    dimensions: '10 x 15 cm',
    icon: '🖼️',
    category: 'grid',
    isPopular: false,
  },
  {
    id: 'grid-6',
    title: 'Gói Kỷ Niệm (6 Ảnh)',
    subtitle: 'Chụp nhiều khoảnh khắc cùng bạn bè',
    slotsCount: 6,
    shotsCount: 6,
    dimensions: '10 x 15 cm',
    icon: '📸',
    category: 'large',
    isPopular: false,
  },
  {
    id: 'single-2',
    title: 'Khung Đôi (2 Ảnh)',
    subtitle: 'Phù hợp cặp đôi & hình dáng kỉ niệm',
    slotsCount: 2,
    shotsCount: 2,
    dimensions: '10 x 15 cm',
    icon: '💖',
    category: 'grid',
    isPopular: false,
  },
]

interface PackageSelectorProps {
  onSelectPackage: (pkg: PackageOption) => void
}

export default function PackageSelector({ onSelectPackage }: PackageSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(PACKAGE_OPTIONS[0].id)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = [
    { key: 'all', label: 'Tất cả gói' },
    { key: 'strip', label: 'Strip Dài (1x4)' },
    { key: 'grid', label: 'Khung Ô Vuông' },
    { key: 'large', label: 'Gói Khung Lớn' },
  ]

  const filteredPackages = activeCategory === 'all'
    ? PACKAGE_OPTIONS
    : PACKAGE_OPTIONS.filter((p) => p.category === activeCategory)

  const selectedPkg = PACKAGE_OPTIONS.find((p) => p.id === selectedId) || PACKAGE_OPTIONS[0]

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Bước 1: Chọn Kích Thước & Kiểu Frame
        </h2>
        <p className="text-white/60 text-sm md:text-base">
          Hãy chọn bố cục và số lượng ảnh phù hợp với trải nghiệm chụp của bạn
        </p>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeCategory === cat.key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_15px_rgba(233,69,96,0.5)] scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {filteredPackages.map((pkg) => {
          const isSelected = pkg.id === selectedId
          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedId(pkg.id)}
              className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 border ${
                isSelected
                  ? 'bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent border-pink-500 shadow-[0_0_25px_rgba(233,69,96,0.35)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {pkg.isPopular && (
                <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-pink-500 text-slate-900 uppercase tracking-wider shadow-md">
                  🔥 Best Seller
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                  {pkg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white mb-1">{pkg.title}</h3>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500 text-white'
                          : 'border-white/30'
                      }`}
                    >
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </div>
                  </div>

                  <p className="text-white/60 text-xs mb-4">{pkg.subtitle}</p>

                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                      📐 {pkg.dimensions}
                    </span>
                    <span className="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/30 font-medium">
                      🖼️ {pkg.slotsCount} Khung ảnh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => onSelectPackage(selectedPkg)}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-base shadow-[0_0_25px_rgba(233,69,96,0.6)] hover:shadow-[0_0_35px_rgba(233,69,96,0.8)] hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          <span>TIẾP TỤC CHỌN KHUNG DECOR</span>
          <span className="text-xl">➔</span>
        </button>
      </div>
    </div>
  )
}
