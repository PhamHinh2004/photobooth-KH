import { ChangeEvent, useState } from 'react'
import type { Frame, FilterPreset, PhotoSticker } from '@/types/capture.types'
import { removeBackground } from '@imgly/background-removal'
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
  const [stickers, setStickers] = useState<PhotoSticker[]>([])
  const [iconQuery, setIconQuery] = useState('cute')
  const [iconResults, setIconResults] = useState<string[]>([])
  const [customizing, setCustomizing] = useState(false)
  const [customBusy, setCustomBusy] = useState(false)

  async function searchIcons() {
    const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(iconQuery)}&limit=18`)
    const data = await response.json() as { icons?: string[] }
    setIconResults(data.icons ?? [])
  }

  function addSticker(src: string, label: string) {
    setStickers((current) => [...current, {
      id: `${label}-${Date.now()}`,
      src,
      label,
      x: 0.5,
      y: 0.5,
      size: 0.16,
      rotation: 0,
      outlineColor: '#ffffff',
    }])
  }

  async function handleCustomUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setCustomBusy(true)
    try {
      const blob = await removeBackground(file)
      addSticker(URL.createObjectURL(blob), 'Icon tự tạo')
      setCustomizing(false)
    } finally {
      setCustomBusy(false)
      event.target.value = ''
    }
  }

  function moveSticker(id: string, x: number, y: number) {
    setStickers((current) => current.map((sticker) => sticker.id === id ? { ...sticker, x, y } : sticker))
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-fadeIn flex flex-col items-center text-slate-900">
      <div className="text-center mb-4 bg-white/85 rounded-3xl py-3 px-8 border border-slate-200 shadow-sm inline-block">
        <h2 className="text-xl font-extrabold text-fuchsia-600 mb-1">
          Bước 5: Hậu Kỳ Ảnh & Hiệu Ứng
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row w-full gap-5 lg:items-stretch justify-center min-h-[min(72vh,760px)]">
        {/* Left: Preview Area (Composer) */}
        <div className="w-full lg:w-5/12 flex justify-center bg-slate-900/90 rounded-3xl p-4 border border-slate-700 shadow-xl lg:sticky lg:top-4 lg:h-[min(72vh,760px)] overflow-auto">
          <PhotoComposer
            photos={photos}
            frame={frame}
            filterPreset={selectedFilter}
            bgColor={selectedBg}
            stickers={stickers}
            onStickerMove={moveSticker}
            onComplete={(processed, original) => setCanvases({ processed, original })}
          />
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4 bg-white/90 p-5 rounded-3xl border border-slate-200 shadow-sm max-h-[min(72vh,760px)] overflow-y-auto">
          
          {/* Section 1: Filters */}
          <div>
            <h3 className="text-slate-800 font-bold mb-3 flex items-center gap-2">
              <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
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
                  <span className={`text-xs font-bold whitespace-nowrap ${selectedFilter.id === filter.id ? 'text-pink-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
                    {filter.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-800 font-bold flex items-center gap-2">
                <span className="bg-fuchsia-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                Thêm icon & sticker
              </h3>
              <button
                type="button"
                onClick={() => setCustomizing((value) => !value)}
                className="rounded-full bg-fuchsia-100 px-3 py-1.5 text-xs font-bold text-fuchsia-700"
              >
                {customizing ? 'Đóng tạo icon' : 'Tạo icon riêng'}
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={iconQuery}
                onChange={(event) => setIconQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void searchIcons() }}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800"
                placeholder="Tìm icon: heart, star..."
              />
              <button type="button" onClick={() => void searchIcons()} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Tìm</button>
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-28 overflow-y-auto">
              {iconResults.map((icon) => (
                <button key={icon} type="button" onClick={() => addSticker(`https://api.iconify.design/${icon}.svg`, icon)} className="rounded-xl border border-slate-200 bg-white p-2 hover:border-fuchsia-400" title={icon}>
                  <img src={`https://api.iconify.design/${icon}.svg`} alt={icon} className="h-7 w-7 mx-auto" />
                </button>
              ))}
            </div>
            {customizing && (
              <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-fuchsia-300 bg-fuchsia-50 px-4 py-3 text-xs font-bold text-fuchsia-700">
                {customBusy ? 'Đang xóa nền...' : 'Kéo thả hoặc chọn ảnh để tạo icon'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} disabled={customBusy} />
              </label>
            )}
            {stickers.length > 0 && <p className="mt-2 text-[11px] text-slate-500">Kéo icon trực tiếp trên ảnh để đặt vị trí.</p>}
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Background Colors */}
          <div>
            <h3 className="text-slate-800 font-bold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
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
                  <span className={`text-xs font-bold whitespace-nowrap ${selectedBg === bg.color ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
                    {bg.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-1 flex flex-row items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
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
