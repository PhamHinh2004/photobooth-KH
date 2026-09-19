import { useState } from 'react'
import type { FilterPreset } from '@/types/capture.types'

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Gốc (Original)',
    description: 'Chân thực & sắc nét',
    cssFilter: 'none',
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    hueRotate: 0,
  },
  {
    id: 'pastel',
    name: 'Pastel Cute 🌸',
    description: 'Tone hồng sáng mềm mại',
    cssFilter: 'brightness(108%) contrast(95%) saturate(115%) sepia(10%)',
    brightness: 108,
    contrast: 95,
    saturate: 115,
    sepia: 10,
    hueRotate: -5,
  },
  {
    id: 'y2k',
    name: 'Y2K Retro 💖',
    description: 'Màu ấm rực rỡ phong cách Y2K',
    cssFilter: 'brightness(112%) contrast(110%) saturate(130%) sepia(15%)',
    brightness: 112,
    contrast: 110,
    saturate: 130,
    sepia: 15,
    hueRotate: 5,
  },
  {
    id: 'vintage',
    name: 'Vintage Film 🎞️',
    description: 'Màu phim hoài niệm',
    cssFilter: 'brightness(100%) contrast(105%) saturate(85%) sepia(35%)',
    brightness: 100,
    contrast: 105,
    saturate: 85,
    sepia: 35,
    hueRotate: 0,
  },
  {
    id: 'bw',
    name: 'Black & White 🖤',
    description: 'Trắng đen cổ điển',
    cssFilter: 'grayscale(100%) contrast(120%)',
    brightness: 100,
    contrast: 120,
    saturate: 0,
    sepia: 0,
    hueRotate: 0,
  },
  {
    id: 'moody',
    name: 'Moody Dark 🌙',
    description: 'Tone trầm cá tính',
    cssFilter: 'brightness(92%) contrast(120%) saturate(90%)',
    brightness: 92,
    contrast: 120,
    saturate: 90,
    sepia: 0,
    hueRotate: 0,
  },
]

interface PhotoFilterAdjustProps {
  photos: HTMLImageElement[]
  onApplyFilter: (selectedFilter: FilterPreset) => void
  onBack: () => void
}

export default function PhotoFilterAdjust({ photos, onApplyFilter, onBack }: PhotoFilterAdjustProps) {
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0])

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Bước 5: Hậu Kỳ & Màu Sắc Bộ Lọc 🎨
        </h2>
        <p className="text-white/60 text-sm">
          Áp dụng màu sắc phong cách cho bộ ảnh trước khi tạo ảnh hoàn chỉnh
        </p>
      </div>

      {/* Preview Grid with active CSS filter applied */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className="rounded-2xl overflow-hidden border-2 border-white/10 bg-black aspect-[4/3] relative shadow-lg"
          >
            <img
              src={photo.src}
              alt={`Filter Preview ${idx + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
              style={{ filter: activeFilter.cssFilter }}
            />
            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] text-white font-bold">
              #{idx + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Filter Presets Carousel / Grid */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <span>✨ Chọn Preset Màu Sắc</span>
          <span className="text-pink-400 text-xs font-normal">({activeFilter.name})</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = activeFilter.id === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => setActiveFilter(preset)}
                className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_15px_rgba(233,69,96,0.4)] scale-105'
                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-inner"
                  style={{ filter: preset.cssFilter }}
                >
                  ABC
                </div>
                <div>
                  <p className="text-white font-bold text-xs truncate max-w-[90px]">{preset.name}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">{preset.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-semibold text-sm transition-all flex items-center gap-2"
        >
          <span>← Quay lại xếp slot</span>
        </button>

        <button
          onClick={() => onApplyFilter(activeFilter)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-base shadow-[0_0_25px_rgba(233,69,96,0.6)] hover:shadow-[0_0_35px_rgba(233,69,96,0.8)] hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span>GHÉP KHUNG HOÀN TẤT</span>
          <span>✨</span>
        </button>
      </div>
    </div>
  )
}
