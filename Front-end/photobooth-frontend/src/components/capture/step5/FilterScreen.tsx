import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import type { Frame, FilterPreset, PhotoSticker } from '@/types/capture.types'
import { removeBackground } from '@imgly/background-removal'
import PhotoComposer from '../PhotoComposer'
import filtersData from '@/data/filters.json'
import effectsData from '@/data/effects.json'
import type { PhotoEffect } from '@/types/capture.types'

const FILTER_PRESETS = filtersData as FilterPreset[]
const EFFECTS = effectsData as PhotoEffect[]

/* ─── 4 Curated Icon Styles requested by User + Custom Creator ─── */
export type IconStyleTab = 'retro-groovy' | 'isometric' | 'hand-drawn' | '3d-depth' | 'custom'

interface StyleDefinition {
  id: IconStyleTab
  label: string
  icon: string
  badge: string
  description: string
  searchKeywords: string
  defaultIcons: string[]
}

const ICON_STYLES: StyleDefinition[] = [
  {
    id: 'retro-groovy',
    label: 'Retro Groovy',
    icon: '🪩',
    badge: 'Y2K & 70s Vibe',
    description: 'Phong cách cổ điển rực rỡ, hoa cúc daisy, hòa bình, disco, màu sắc vui tươi',
    searchKeywords: 'flower,daisy,peace,disco,rainbow,retro,sunflower,cherries,mushroom',
    defaultIcons: [
      'fluent-emoji:sunflower',
      'fluent-emoji:blossom',
      'fluent-emoji:cherry-blossom',
      'fluent-emoji:rainbow',
      'fluent-emoji:sparkles',
      'fluent-emoji:mirror-ball',
      'fluent-emoji:victory-hand',
      'fluent-emoji:love-you-gesture',
      'fluent-emoji:roller-skate',
      'fluent-emoji:cassette-tape',
      'fluent-emoji:radio',
      'fluent-emoji:headphone',
      'fluent-emoji:cherries',
      'fluent-emoji:mushroom',
      'fluent-emoji:smiling-face-with-sunglasses',
      'fluent-emoji:partying-face',
      'fluent-emoji:heart-on-fire',
      'fluent-emoji:sparkling-heart',
      'fluent-emoji:kiss-mark',
      'fluent-emoji:lipstick',
      'fluent-emoji:magic-wand',
      'fluent-emoji:guitar',
      'fluent-emoji:video-game',
      'fluent-emoji:fire',
      'fluent-emoji:hibiscus',
      'fluent-emoji:crown',
      'fluent-emoji:ring',
      'fluent-emoji:lollipop',
      'fluent-emoji:butterfly',
      'fluent-emoji:glowing-star',
    ],
  },
  {
    id: 'isometric',
    label: 'Isometric',
    icon: '📐',
    badge: '3D Trục Đo',
    description: 'Khối hộp không gian 3 chiều góc nghiêng isometric, kiến trúc, gaming & đồ họa kỹ thuật',
    searchKeywords: 'cube,box,computer,isometric,house,arcade,gaming,building',
    defaultIcons: [
      'fluent-emoji:brick',
      'fluent-emoji:puzzle-piece',
      'fluent-emoji:package',
      'fluent-emoji:desktop-computer',
      'fluent-emoji:laptop',
      'fluent-emoji:joystick',
      'fluent-emoji:video-game',
      'fluent-emoji:keyboard',
      'fluent-emoji:printer',
      'fluent-emoji:toolbox',
      'fluent-emoji:gear',
      'fluent-emoji:house-with-garden',
      'fluent-emoji:office-building',
      'fluent-emoji:bank',
      'fluent-emoji:japanese-castle',
      'fluent-emoji:stadium',
      'fluent-emoji:ferris-wheel',
      'fluent-emoji:roller-coaster',
      'fluent-emoji:rocket',
      'fluent-emoji:automobile',
      'fluent-emoji:delivery-truck',
      'fluent-emoji:locomotive',
      'fluent-emoji:tent',
      'fluent-emoji:shopping-cart',
      'fluent-emoji:compass',
      'fluent-emoji:flying-saucer',
      'fluent-emoji:convenience-store',
      'fluent-emoji:factory',
      'fluent-emoji:carousel-horse',
      'fluent-emoji:books',
    ],
  },
  {
    id: 'hand-drawn',
    label: 'Vẽ Tay – Chân Thực',
    icon: '✏️',
    badge: 'Hand-Drawn & Doodle',
    description: 'Nét vẽ phác thảo mộc mạc, gần gũi, ngộ nghĩnh như bút chì màu và sticker sổ tay',
    searchKeywords: 'crayon,drawing,pencil,doodle,sketch,sticker,note',
    defaultIcons: [
      'streamline-freehand-color:color-crayon',
      'streamline-freehand-color:color-brush-1',
      'streamline-freehand-color:color-palette',
      'streamline-freehand-color:design-process-draw-pen',
      'streamline-freehand-color:color-spray',
      'streamline-freehand-color:design-tool-brush-ruler',
      'streamline-stickies-color:pin-paper',
      'streamline-stickies-color:heart-note',
      'streamline-stickies-color:star-note',
      'streamline-stickies-color:smile-note',
      'streamline-stickies-color:tag-note',
      'streamline-stickies-color:bubble-note',
      'openmoji:sparkles',
      'openmoji:smiling-face-with-smiling-eyes',
      'openmoji:cat-face',
      'openmoji:dog-face',
      'openmoji:rabbit-face',
      'openmoji:cherry-blossom',
      'openmoji:tulip',
      'openmoji:sunflower',
      'openmoji:star',
      'openmoji:heart-suit',
      'openmoji:camera',
      'openmoji:artist-palette',
      'openmoji:sparkling-heart',
      'openmoji:party-popper',
      'openmoji:wrapped-gift',
      'openmoji:balloon',
      'openmoji:shooting-star',
      'openmoji:rainbow',
    ],
  },
  {
    id: '3d-depth',
    label: 'Chiều Sâu 3D',
    icon: '✨',
    badge: 'Depth & Glossy',
    description: 'Hiệu ứng nổi khối 3D đổ bóng mềm, ánh sáng chiều sâu sống động, căng mọng',
    searchKeywords: '3d,glossy,heart,star,gift,camera,fire,crown,diamond',
    defaultIcons: [
      'fluent-emoji:red-heart',
      'fluent-emoji:sparkles',
      'fluent-emoji:fire',
      'fluent-emoji:smiling-face-with-heart-eyes',
      'fluent-emoji:star',
      'fluent-emoji:crown',
      'fluent-emoji:gem-stone',
      'fluent-emoji:party-popper',
      'fluent-emoji:wrapped-gift',
      'fluent-emoji:balloon',
      'fluent-emoji:camera-with-flash',
      'fluent-emoji:lollipop',
      'fluent-emoji:cupcake',
      'fluent-emoji:butterfly',
      'fluent-emoji:magic-wand',
      'fluent-emoji:teddy-bear',
      'fluent-emoji:blossom',
      'fluent-emoji:rose',
      'fluent-emoji:crystal-ball',
      'fluent-emoji:ghost',
      'fluent-emoji:ring',
      'fluent-emoji:clapping-hands',
      'fluent-emoji:eyes',
      'fluent-emoji:cat-with-tears-of-joy',
      'fluent-emoji:love-letter',
      'fluent-emoji:hibiscus',
      'fluent-emoji:doughnut',
      'fluent-emoji:candy',
      'fluent-emoji:shortcake',
      'fluent-emoji:hundred-points',
    ],
  },
]

interface FilterScreenProps {
  photos: string[]
  frame: Frame
  precomposed?: boolean
  onBack: () => void
  onNext: (processedCanvas: HTMLCanvasElement, originalCanvas: HTMLCanvasElement, filter: FilterPreset, bgColor: string) => void
}

export default function FilterScreen({ photos, frame, precomposed = false, onBack, onNext }: FilterScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0])
  const [selectedEffect, setSelectedEffect] = useState<string>('none')
  const [effectOpacity, setEffectOpacity] = useState<number>(1)
  const [canvases, setCanvases] = useState<{ processed: HTMLCanvasElement | null, original: HTMLCanvasElement | null }>({ processed: null, original: null })
  const [stickers, setStickers] = useState<PhotoSticker[]>([])

  /* ─── Active Tab for Icon Styles ─── */
  const [activeTab, setActiveTab] = useState<IconStyleTab>('retro-groovy')
  const [iconQuery, setIconQuery] = useState('')
  const [iconResults, setIconResults] = useState<string[]>([])
  const [iconLoading, setIconLoading] = useState(false)

  /* ─── Selected Sticker State ─── */
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)

  /* ─── Custom Icon Creator ─── */
  const [customBusy, setCustomBusy] = useState(false)
  const [customProgress, setCustomProgress] = useState(0)
  const [customPreview, setCustomPreview] = useState<string | null>(null)
  const [customOutlineColor, setCustomOutlineColor] = useState('#ffffff')
  const [customOutlineWidth, setCustomOutlineWidth] = useState(3)
  const customCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  /* ─── Context Menu ─── */
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, stickerId: string } | null>(null)

  // ────────── Icon Search via Iconify API ──────────
  const searchIcons = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIconResults([])
      return
    }
    setIconLoading(true)
    try {
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=36`)
      const json = await response.json() as { icons?: string[] }
      setIconResults(json.icons ?? [])
    } catch {
      setIconResults([])
    } finally {
      setIconLoading(false)
    }
  }, [])

  // ────────── Sticker Operations ──────────
  function addSticker(src: string, label: string, outlineColor = '#ffffff', outlineWidth = 0) {
    const newId = `${label}-${Date.now()}`
    const newSticker: PhotoSticker = {
      id: newId,
      src,
      label,
      x: 0.5,
      y: 0.5,
      size: 0.15,
      rotation: 0,
      outlineColor,
      outlineWidth,
    }
    setStickers((current) => [...current, newSticker])
    setSelectedStickerId(newId)
  }

  function removeSticker(id: string) {
    setStickers((current) => current.filter((s) => s.id !== id))
    setSelectedStickerId((curr) => (curr === id ? null : curr))
  }

  function duplicateSticker(id: string) {
    setStickers((current) => {
      const original = current.find((s) => s.id === id)
      if (!original) return current
      const newId = `${original.label}-${Date.now()}`
      const duplicated: PhotoSticker = {
        ...original,
        id: newId,
        x: Math.min(0.85, original.x + 0.05),
        y: Math.min(0.85, original.y + 0.05),
      }
      setSelectedStickerId(newId)
      return [...current, duplicated]
    })
  }

  function rotateSticker(id: string, newRotation: number) {
    // Normalizes to 0..360
    const normalized = ((Math.round(newRotation) % 360) + 360) % 360
    setStickers((current) =>
      current.map((s) => (s.id === id ? { ...s, rotation: normalized } : s))
    )
  }

  function rotate180Circle(id: string) {
    setStickers((current) =>
      current.map((s) => (s.id === id ? { ...s, rotation: (s.rotation + 180) % 360 } : s))
    )
  }

  function resizeSticker(id: string, newSize: number) {
    const clamped = Math.max(0.06, Math.min(0.45, Number(newSize.toFixed(2))))
    setStickers((current) =>
      current.map((s) => (s.id === id ? { ...s, size: clamped } : s))
    )
  }

  function moveSticker(id: string, x: number, y: number) {
    setStickers((current) => current.map((sticker) => sticker.id === id ? { ...sticker, x, y } : sticker))
  }

  // ────────── Custom Icon Creator Handlers ──────────
  async function handleFile(file: File) {
    setCustomBusy(true)
    setCustomProgress(0)
    try {
      const blob = await removeBackground(file)
      const url = URL.createObjectURL(blob)
      setCustomPreview(url)
    } catch (err) {
      console.error('Lỗi xóa nền:', err)
    } finally {
      setCustomBusy(false)
    }
  }

  async function handleCustomUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFile(file)
    event.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDraggingFile(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/') && !customBusy) {
      void handleFile(file)
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (customBusy) {
      setCustomProgress(0)
      interval = setInterval(() => {
        setCustomProgress((prev) => {
          if (prev < 30) return prev + 1
          if (prev < 60) return prev + 0.5
          if (prev < 95) return prev + 0.2
          return prev
        })
      }, 50)
    } else {
      setCustomProgress(100)
    }
    return () => clearInterval(interval)
  }, [customBusy])

  useEffect(() => {
    if (!customPreview || !customCanvasRef.current) return
    const canvas = customCanvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      const size = 200
      canvas.width = size
      canvas.height = size
      ctx.clearRect(0, 0, size, size)

      if (customOutlineWidth > 0) {
        const steps = Math.max(8, customOutlineWidth * 4)
        for (let i = 0; i < steps; i++) {
          const angle = (2 * Math.PI * i) / steps
          ctx.drawImage(
            img,
            10 + Math.cos(angle) * customOutlineWidth,
            10 + Math.sin(angle) * customOutlineWidth,
            size - 20,
            size - 20
          )
        }
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = customOutlineColor
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.drawImage(img, 10, 10, size - 20, size - 20)
    }
    img.src = customPreview
  }, [customPreview, customOutlineColor, customOutlineWidth])

  function handleAddCustomIcon() {
    if (!customCanvasRef.current) return
    const dataUrl = customCanvasRef.current.toDataURL('image/png')
    addSticker(dataUrl, 'Icon tự tạo', customOutlineColor, customOutlineWidth)
    setCustomPreview(null)
  }

  // ────────── Context Menu ──────────
  function handleContextMenu(stickerId: string, x: number, y: number) {
    setSelectedStickerId(stickerId)
    setContextMenu({ x, y, stickerId })
  }

  // Active style info
  const activeStyle = ICON_STYLES.find((s) => s.id === activeTab)
  const displayedIcons = iconQuery.trim()
    ? iconResults
    : (activeStyle?.defaultIcons ?? [])

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId)

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-24 text-slate-900">
      {/* ── 1. Hero Card matching Step 1, 2, 4 ── */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-sm relative overflow-hidden mb-8">
        {/* Soft baby blue aura on the right */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#89CFF0]/25 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c026d3]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#89CFF0]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#C0C0C0]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 text-gray-600 text-xs font-semibold border border-gray-200/80 shadow-2xs">
              ✨ Y2K Sticker &amp; Filter Studio
            </span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 mb-2">
          <span className="bg-gradient-to-r from-[#d946ef] via-[#9333ea] to-[#2563eb] bg-clip-text text-transparent">
            Bước 5: Hậu Kỳ Ảnh &amp; Hiệu Ứng
          </span>
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-2xl leading-relaxed">
          Tùy chỉnh filter màu, chọn màu viền ảnh in và trang trí sticker theo phong cách độc đáo của bạn.
        </p>
      </div>

      {/* ── 2. Main Work Area: 2 Columns ── */}
      <div className="flex flex-col lg:flex-row w-full gap-6 lg:items-start justify-center">
        
        {/* ── Left Column: Preview Canvas in Glass Card ── */}
        <div className="w-full lg:w-5/12 bg-white/80 backdrop-blur-md rounded-[32px] p-5 sm:p-6 border border-white/80 shadow-sm relative flex flex-col items-center justify-between lg:sticky lg:top-4 min-h-[520px]">
          {/* Card Header badge */}
          <div className="w-full flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-200/60 text-[#c026d3] text-xs font-bold uppercase tracking-wider">
              <span>📷</span> BẢN IN XEM TRƯỚC
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Frame: {frame.name}
            </span>
          </div>

          {/* Photo frame container */}
          <div className="w-full flex-1 flex items-center justify-center py-2 relative">
            <PhotoComposer
              photos={photos}
              frame={frame}
              precomposed={precomposed}
              filterPreset={selectedFilter}
              effect={EFFECTS.find(e => e.id === selectedEffect)}
              effectOpacity={effectOpacity}
              stickers={stickers}
              selectedStickerId={selectedStickerId}
              onSelectSticker={setSelectedStickerId}
              onStickerMove={moveSticker}
              onStickerResize={resizeSticker}
              onStickerRotate={rotateSticker}
              onStickerDuplicate={duplicateSticker}
              onStickerDelete={removeSticker}
              onStickerContextMenu={handleContextMenu}
              onComplete={(processed, original) => setCanvases({ processed, original })}
            />

            {/* Context Menu (Right Click) */}
            {contextMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onPointerDown={() => setContextMenu(null)}
                  onClick={() => setContextMenu(null)}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
                />
                <div
                  className="fixed z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 py-1.5 min-w-[190px] animate-fadeIn text-slate-800"
                  style={{
                    left: Math.min(window.innerWidth - 200, Math.max(10, contextMenu.x)),
                    top: Math.min(window.innerHeight - 240, Math.max(10, contextMenu.y)),
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 flex items-center gap-2.5 transition-colors"
                    onClick={() => {
                      rotate180Circle(contextMenu.stickerId)
                      setContextMenu(null)
                    }}
                  >
                    <span className="text-base">🔄</span> Xoay 180° vòng tròn
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 flex items-center gap-2.5 transition-colors"
                    onClick={() => {
                      const s = stickers.find((item) => item.id === contextMenu.stickerId)
                      if (s) resizeSticker(contextMenu.stickerId, s.size + 0.03)
                      setContextMenu(null)
                    }}
                  >
                    <span className="text-base">➕</span> Phóng to icon
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 flex items-center gap-2.5 transition-colors"
                    onClick={() => {
                      const s = stickers.find((item) => item.id === contextMenu.stickerId)
                      if (s) resizeSticker(contextMenu.stickerId, s.size - 0.03)
                      setContextMenu(null)
                    }}
                  >
                    <span className="text-base">➖</span> Thu nhỏ icon
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors border-t border-slate-100"
                    onClick={() => {
                      duplicateSticker(contextMenu.stickerId)
                      setContextMenu(null)
                    }}
                  >
                    <span className="text-base">📋</span> Nhân đôi icon
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-slate-100"
                    onClick={() => {
                      removeSticker(contextMenu.stickerId)
                      setContextMenu(null)
                    }}
                  >
                    <span className="text-base">🗑️</span> Xóa icon
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Helper caption */}
          <p className="text-[11px] text-gray-400 text-center mt-3 select-none">
            💡 Click icon để xoay tròn 360° &amp; kéo góc resize • Chuột phải để menu
          </p>
        </div>

        {/* ── Right Column: Studio Controls in Glass Card ── */}
        <div className="w-full lg:w-7/12 bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-7 border border-white/80 shadow-sm flex flex-col gap-6">

          {/* ── Section 1: Filters ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#d946ef] to-[#9333ea] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  1
                </span>
                Chọn Filter Màu Ảnh
              </h3>
              <span className="text-xs font-semibold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-0.5 rounded-full border border-fuchsia-200/60">
                {selectedFilter.name}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              {FILTER_PRESETS.map((filter) => {
                const isSelected = selectedFilter.id === filter.id
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className="flex flex-col items-center gap-2 min-w-[76px] group transition-all cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl bg-[url('https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=100&auto=format&fit=crop')] bg-cover bg-center transition-all ${
                        isSelected
                          ? 'ring-3 ring-fuchsia-500 scale-105 shadow-md shadow-fuchsia-500/20'
                          : 'border-2 border-slate-200 group-hover:border-slate-400 group-hover:scale-102'
                      }`}
                      style={{ filter: filter.cssFilter }}
                    />
                    <span className={`text-[11px] font-bold whitespace-nowrap transition-colors ${isSelected ? 'text-fuchsia-700' : 'text-slate-500 group-hover:text-slate-800'}`}>
                      {filter.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* ── Section 2: Special Effects ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#2563eb] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  2
                </span>
                Thêm Hiệu Ứng
              </h3>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                {EFFECTS.find((e) => e.id === selectedEffect)?.name || 'Mặc định'}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              {EFFECTS.map((effect) => {
                const isSelected = selectedEffect === effect.id
                return (
                  <button
                    key={effect.id}
                    onClick={() => {
                      setSelectedEffect(effect.id)
                      setEffectOpacity(effect.defaultOpacity)
                    }}
                    className="flex flex-col items-center gap-2 min-w-[76px] group transition-all cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl transition-all border flex items-center justify-center text-2xl ${
                        isSelected
                          ? 'ring-3 ring-sky-500 scale-105 shadow-md shadow-sky-500/20 border-white bg-sky-50'
                          : 'border-slate-200 group-hover:border-slate-400 group-hover:scale-102 bg-white'
                      }`}
                      style={effect.color ? { backgroundColor: isSelected ? effect.color : '#f8fafc' } : {}}
                    >
                      {effect.icon}
                    </div>
                    <span className={`text-[11px] font-bold whitespace-nowrap transition-colors ${isSelected ? 'text-sky-700' : 'text-slate-500 group-hover:text-slate-800'}`}>
                      {effect.name}
                    </span>
                  </button>
                )
              })}
            </div>
            
            {/* Opacity slider for selected effect (if not 'none') */}
            {selectedEffect !== 'none' && (
              <div className="mt-4 flex items-center gap-3 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Độ đậm:</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={effectOpacity}
                  onChange={(e) => setEffectOpacity(Number(e.target.value))}
                  className="flex-1 accent-sky-500 h-1.5"
                />
                <span className="text-xs font-mono font-bold text-sky-600 w-8 text-right">
                  {Math.round(effectOpacity * 100)}%
                </span>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* ── Section 3: Sticker & Icon Studio (4 Requested Styles) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#ec4899] to-[#f43f5e] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  3
                </span>
                Kho Icon &amp; Sticker Độc Quyền
              </h3>
              {stickers.length > 0 && (
                <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-0.5 rounded-full border border-fuchsia-200">
                  {stickers.length} icon trên ảnh
                </span>
              )}
            </div>

            {/* ── 4 Style Tabs + Custom Tab ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
              {ICON_STYLES.map((style) => {
                const isActive = activeTab === style.id
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(style.id)
                      setIconQuery('')
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white text-fuchsia-700 shadow-sm shadow-slate-200 scale-102'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{style.icon}</span>
                    <span className="truncate">{style.label}</span>
                  </button>
                )
              })}

              {/* Tab 5: Tạo icon riêng */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('custom')
                  setIconQuery('')
                }}
                className={`col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-sm shadow-fuchsia-500/25 scale-102'
                    : 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100'
                }`}
              >
                <span>✂️</span>
                <span>Tạo Riêng</span>
              </button>
            </div>

            {/* ── Style Description Banner ── */}
            {activeStyle && activeTab !== 'custom' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-fuchsia-50/50 px-3 py-2 rounded-xl border border-slate-200/70 mb-3">
                <p className="text-[11px] text-slate-600 font-medium">
                  <span className="font-bold text-fuchsia-700">{activeStyle.label}:</span> {activeStyle.description}
                </p>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 ml-2 whitespace-nowrap">
                  {activeStyle.badge}
                </span>
              </div>
            )}

            {/* ── Search Bar for Icon Styles ── */}
            {activeTab !== 'custom' && (
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    value={iconQuery}
                    onChange={(e) => setIconQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void searchIcons(iconQuery) }}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50"
                    placeholder={`Tìm icon trong style ${activeStyle?.label || ''}...`}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">🔍</span>
                </div>
                <button
                  type="button"
                  onClick={() => void searchIcons(iconQuery)}
                  className="rounded-xl bg-gradient-to-r from-[#d946ef] to-[#9333ea] px-4 py-2 text-xs font-bold text-white hover:opacity-95 shadow-sm transition-opacity cursor-pointer"
                >
                  Tìm
                </button>
                {iconQuery && (
                  <button
                    type="button"
                    onClick={() => { setIconQuery(''); setIconResults([]) }}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            )}

            {/* ── Icon Grid (30+ Icons per style) ── */}
            {activeTab !== 'custom' && (
              <div className="grid grid-cols-6 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                {iconLoading && (
                  <div className="col-span-6 flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">Đang tìm kiếm sticker...</span>
                  </div>
                )}

                {!iconLoading && displayedIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => addSticker(`https://api.iconify.design/${icon}.svg`, icon)}
                    className="rounded-2xl border border-slate-200/90 bg-white p-2 hover:border-fuchsia-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all group cursor-pointer flex flex-col items-center justify-center aspect-square"
                    title={icon}
                  >
                    <img
                      src={`https://api.iconify.design/${icon}.svg`}
                      alt={icon}
                      className="h-8 w-8 object-contain group-hover:scale-110 transition-transform"
                      loading="lazy"
                    />
                  </button>
                ))}

                {!iconLoading && displayedIcons.length === 0 && (
                  <div className="col-span-6 text-center py-6 text-xs text-slate-400">
                    Không tìm thấy icon phù hợp. Thử từ khóa khác như "flower", "heart", "star"...
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Custom Icon Creator ── */}
            {activeTab === 'custom' && (
              <div className="space-y-3">
                {!customPreview ? (
                  <label 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                      isDraggingFile 
                        ? 'border-fuchsia-600 bg-fuchsia-100/50 scale-102 ring-4 ring-fuchsia-500/20' 
                        : 'border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-pink-50 hover:border-fuchsia-500'
                    }`}
                  >
                    {customBusy ? (
                      <>
                        <div className="w-12 h-12 relative mb-4">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-fuchsia-200"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-fuchsia-500 transition-all duration-300"
                              strokeWidth="3"
                              strokeDasharray={`${customProgress}, 100`}
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-fuchsia-700">{Math.floor(customProgress)}%</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-fuchsia-700">Đang tự động tách nền AI...</span>
                        <span className="text-xs text-fuchsia-500 mt-1">Đang xử lý chi tiết hình ảnh</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl mb-2">📤</span>
                        <span className="text-sm font-bold text-fuchsia-700">Kéo thả ảnh hoặc click để tải lên</span>
                        <span className="text-xs text-slate-500 mt-1">Hệ thống sẽ tự động tách nền bằng AI</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} disabled={customBusy} />
                  </label>
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-fuchsia-50 rounded-2xl p-4 border border-fuchsia-200">
                    <h4 className="text-sm font-bold text-fuchsia-700 mb-3 flex items-center gap-2">
                      ✏️ Tùy chỉnh viền icon trước khi thêm
                    </h4>

                    {/* Preview canvas */}
                    <div className="flex justify-center mb-4">
                      <div className="relative bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)] bg-[length:14px_14px] rounded-xl p-2 border border-slate-200">
                        <canvas ref={customCanvasRef} className="w-[150px] h-[150px] object-contain" />
                      </div>
                    </div>

                    {/* Outline color */}
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Màu viền:</label>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {['#ffffff', '#000000', '#ff4d6d', '#ff6b35', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff69b4', '#00f5d4'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCustomOutlineColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
                              customOutlineColor === color ? 'border-fuchsia-500 scale-110 shadow-sm' : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={customOutlineColor}
                          onChange={(e) => setCustomOutlineColor(e.target.value)}
                          className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer"
                          title="Chọn màu tùy biến"
                        />
                      </div>
                    </div>

                    {/* Outline width slider */}
                    <div className="flex items-center gap-3 mb-4">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Độ dày viền:</label>
                      <input
                        type="range"
                        min={0}
                        max={12}
                        step={1}
                        value={customOutlineWidth}
                        onChange={(e) => setCustomOutlineWidth(Number(e.target.value))}
                        className="flex-1 accent-fuchsia-500 h-1.5"
                      />
                      <span className="text-xs font-mono text-slate-600 w-8 text-center">{customOutlineWidth}px</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomPreview(null)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        ❌ Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomIcon}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-xs font-bold hover:opacity-95 shadow-md transition-opacity cursor-pointer"
                      >
                        ✅ Thêm icon vào ảnh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 4. Selected Sticker Studio Controls (Rotate in circle, resize, etc.) ── */}
            {selectedSticker && (
              <div className="mt-4 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-purple-50 p-4 rounded-2xl border border-fuchsia-200 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-fuchsia-800 flex items-center gap-1.5">
                    ✨ Đang chỉnh icon: <span className="text-slate-800 truncate max-w-[140px]">{selectedSticker.label}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStickerId(null)}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    Bỏ chọn ✕
                  </button>
                </div>

                {/* Circular Rotation Slider (0° - 360°) */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                    <span>🔄</span> Góc xoay:
                  </span>
                  <button
                    type="button"
                    onClick={() => rotateSticker(selectedSticker.id, (selectedSticker.rotation - 15 + 360) % 360)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Xoay ngược chiều kim đồng hồ 15°"
                  >
                    ↺
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={selectedSticker.rotation}
                    onChange={(e) => rotateSticker(selectedSticker.id, Number(e.target.value))}
                    className="flex-1 accent-fuchsia-500 h-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => rotateSticker(selectedSticker.id, (selectedSticker.rotation + 15) % 360)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Xoay thuận chiều kim đồng hồ 15°"
                  >
                    ↻
                  </button>
                  <span className="text-[11px] font-mono font-bold text-fuchsia-600 w-10 text-right">
                    {selectedSticker.rotation}°
                  </span>
                </div>

                {/* Size Slider */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                    <span>🔍</span> Cỡ to nhỏ:
                  </span>
                  <button
                    type="button"
                    onClick={() => resizeSticker(selectedSticker.id, selectedSticker.size - 0.02)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Thu nhỏ"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0.06}
                    max={0.45}
                    step={0.01}
                    value={selectedSticker.size}
                    onChange={(e) => resizeSticker(selectedSticker.id, Number(e.target.value))}
                    className="flex-1 accent-fuchsia-500 h-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => resizeSticker(selectedSticker.id, selectedSticker.size + 0.02)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-fuchsia-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Phóng to"
                  >
                    +
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 w-10 text-right">
                    {Math.round(selectedSticker.size * 100)}%
                  </span>
                </div>

                {/* Quick actions for selected sticker */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => rotate180Circle(selectedSticker.id)}
                    className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Xoay 180° theo vòng tròn"
                  >
                    🔄 180°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateSticker(selectedSticker.id, 0)}
                    className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Đặt lại góc thẳng 0°"
                  >
                    0° Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateSticker(selectedSticker.id)}
                    className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    📋 Nhân đôi
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSticker(selectedSticker.id)}
                    className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            )}

            {/* Sticker summary bar */}
            {stickers.length > 0 && (
              <div className="mt-3 flex items-center justify-between bg-fuchsia-50/70 rounded-xl px-3.5 py-2 border border-fuchsia-200/80">
                <p className="text-[11px] text-fuchsia-800 font-medium">
                  📌 {stickers.length} icon đang dùng — Kéo để di chuyển, nhấp để xoay tròn &amp; resize
                </p>
                <button
                  type="button"
                  onClick={() => { setStickers([]); setSelectedStickerId(null) }}
                  className="text-[11px] text-red-500 font-bold hover:text-red-700 transition-colors cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 3. Bottom Action Buttons matching ReviewScreen & FrameSelector ── */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>←</span>
          <span>QUAY LẠI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (canvases.processed && canvases.original) {
              onNext(canvases.processed, canvases.original, selectedFilter, selectedEffect)
            }
          }}
          disabled={!canvases.processed}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#89CFF0] to-[#38bdf8] text-gray-900 font-bold text-sm shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>HOÀN THÀNH &amp; XUẤT ẢNH</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
