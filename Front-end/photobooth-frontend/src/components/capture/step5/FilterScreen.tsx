import { useState } from 'react'
import type { Frame, FilterPreset } from '@/types/capture.types'
import PhotoComposer from '../PhotoComposer'
import filtersData from '@/data/filters.json'
import backgroundsData from '@/data/backgrounds.json'

const FILTER_PRESETS = filtersData as FilterPreset[]
const BACKGROUNDS = backgroundsData as { id: string, name: string, color: string }[]

interface FilterScreenProps {
  photos: string[]
  frame: Frame
  onBack: () => void
  onNext: (processedCanvas: HTMLCanvasElement, originalCanvas: HTMLCanvasElement, filter: FilterPreset, bgColor: string) => void
}

export default function FilterScreen({ photos, frame, onBack, onNext }: FilterScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0])
  const [selectedBg, setSelectedBg] = useState<string>(BACKGROUNDS[0].color)
  const [canvases, setCanvases] = useState<{ processed: HTMLCanvasElement | null, original: HTMLCanvasElement | null }>({ processed: null, original: null })

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn flex flex-col items-center">
      <div className="text-center mb-8 bg-white/5 rounded-3xl py-4 px-8 border border-white/10 shadow-sm inline-block">
        <h2 className="text-xl font-bold text-pink-400 mb-1">
          Bước 5: Hậu Kỳ Ảnh & Hiệu Ứng
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row w-full gap-8 lg:items-start justify-center">
        {/* Left: Preview Area (Composer) */}
        <div className="w-full lg:w-5/12 flex justify-center bg-black/20 rounded-3xl p-6 border border-white/10 shadow-xl">
          <PhotoComposer
            photos={photos}
            frame={frame}
            filterPreset={selectedFilter}
            bgColor={selectedBg}
            onComplete={(processed, original) => setCanvases({ processed, original })}
          />
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-7/12 flex flex-col gap-8 bg-white/10 p-8 rounded-3xl border border-white/10">
          
          {/* Section 1: Filters */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="bg-pink-500 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Chọn Filter Màu Chỉnh Sửa Ảnh
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20">
              {FILTER_PRESETS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter)}
                  className={`flex flex-col items-center gap-2 min-w-[80px] group transition-all`}
                >
                  <div 
                    className={`w-16 h-16 rounded-full bg-[url('https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=100&auto=format&fit=crop')] bg-cover bg-center border-4 transition-all ${
                      selectedFilter.id === filter.id
                        ? 'border-pink-500 shadow-[0_0_15px_rgba(233,69,96,0.5)] scale-110'
                        : 'border-white/20 group-hover:border-white/50'
                    }`}
                    style={{ filter: filter.cssFilter }}
                  />
                  <span className={`text-xs font-bold whitespace-nowrap ${selectedFilter.id === filter.id ? 'text-pink-400' : 'text-white/60 group-hover:text-white/90'}`}>
                    {filter.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Section 2: Background Colors */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Chọn Frame (Màu sắc viền) Ảnh In
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.color)}
                  className={`flex flex-col items-center gap-2 min-w-[70px] group transition-all`}
                >
                  <div 
                    className={`w-14 h-14 rounded-full border-4 transition-all ${
                      selectedBg === bg.color
                        ? 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] scale-110'
                        : 'border-white/20 group-hover:border-white/50'
                    }`}
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className={`text-xs font-bold whitespace-nowrap ${selectedBg === bg.color ? 'text-blue-400' : 'text-white/60 group-hover:text-white/90'}`}>
                    {bg.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-row items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              ← Quay Lại
            </button>
            
            <button
              onClick={() => {
                if (canvases.processed && canvases.original) {
                  onNext(canvases.processed, canvases.original, selectedFilter, selectedBg)
                }
              }}
              disabled={!canvases.processed}
              className="px-10 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-[0_0_20px_rgba(233,69,96,0.4)] hover:shadow-[0_0_30px_rgba(233,69,96,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              Tiếp Tục ➡️
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
