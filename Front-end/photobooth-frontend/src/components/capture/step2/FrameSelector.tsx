import { useEffect, useState } from 'react'
import { Spin, Alert } from 'antd'
import { getFrames, getFramesByAspectRatio } from '@/api/capture.api'
import type { Frame, PackageOption } from '@/types/capture.types'

interface FrameSelectorProps {
  selectedPackage?: PackageOption | null
  onSelect: (frame: Frame) => void
  onBack: () => void
}

export default function FrameSelector({ selectedPackage, onSelect, onBack }: FrameSelectorProps) {
  const [frames, setFrames] = useState<Frame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)

  const tags = [
    { key: 'all', label: `Tất cả (${frames.length})`, icon: '' },
    { key: 'y2k', label: 'Y2K Cyber', icon: '✨' },
    { key: 'retro', label: 'Retro Vintage', icon: '🎞️' },
    { key: 'anime', label: 'Anime Manga', icon: '🌸' },
    { key: 'marvel', label: 'Marvel / Comics', icon: '🦸' },
    { key: 'pastel', label: 'Cute Pastel', icon: '🦄' },
    { key: 'minimal', label: 'Minimalist Clean', icon: '🔍' },
  ]

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    setLoading(true)
    const fetchPromise = selectedPackage
      ? getFramesByAspectRatio(selectedPackage.id, debouncedSearchQuery)
      : getFrames(debouncedSearchQuery)

    fetchPromise
      .then((data) => {
        setFrames(data)
        if (data.length > 0) {
          setSelectedFrame(data[0])
        }
      })
      .catch(() => setError('Không tải được danh sách frame. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [selectedPackage, debouncedSearchQuery])

  const filteredFrames = frames.filter((frame) => {
    if (selectedTag === 'all') return true
    const search = selectedTag.toLowerCase()
    const nameMatch = frame.name.toLowerCase().includes(search)
    const catMatch = frame.category && frame.category.toLowerCase().includes(search)
    const tagMatch = frame.tags && frame.tags.some((t) => t.toLowerCase().includes(search))
    return nameMatch || catMatch || tagMatch
  })

  const getFrameBadge = (frame: Frame) => {
    const name = frame.name.toLowerCase()
    if (name.includes('marvel') || name.includes('comic')) {
      return { label: 'MARVEL', bg: 'bg-red-100 text-red-700' }
    }
    if (name.includes('minimal')) {
      return { label: 'MINIMALIST CLEAN', bg: 'bg-gray-100 text-gray-700' }
    }
    if (name.includes('retro') || name.includes('vintage') || name.includes('orange')) {
      return { label: 'RETRO', bg: 'bg-amber-100 text-amber-700' }
    }
    if (name.includes('anime') || name.includes('sakura') || name.includes('kawaii')) {
      return { label: 'KAWAII ANIME', bg: 'bg-pink-100 text-pink-700' }
    }
    if (name.includes('y2k') || name.includes('ballon') || name.includes('cyber')) {
      return { label: 'Y2K', bg: 'bg-rose-100 text-rose-700' }
    }
    if (name.includes('pastel')) {
      return { label: 'PASTEL CUTE', bg: 'bg-purple-100 text-purple-700' }
    }
    return { label: frame.category?.toUpperCase() || 'POPULAR', bg: 'bg-sky-100 text-sky-700' }
  }

  const getFrameCode = (frame: Frame, idx: number) => {
    const name = frame.name.toLowerCase()
    if (name.includes('marvel')) return '#Mar-001'
    if (name.includes('minimal')) return '#Mini-090'
    if (name.includes('retro')) return '#Ret-200'
    if (name.includes('anime') || name.includes('sakura')) return '#SAK-014'
    if (name.includes('y2k') || name.includes('ballon')) return '#Y2K-122'
    return `#KH-${String(idx + 1).padStart(3, '0')}`
  }

  const getFrameDescription = (frame: Frame) => {
    const name = frame.name.toLowerCase()
    if (name.includes('marvel')) {
      return 'Mang màu sắc phá cách của thế giới Marvel, tạo cảm giác ngầu, dũng cảm như cái cách các bộ phim đem lại.'
    }
    if (name.includes('minimal')) {
      return 'Tone cam cháy ấm áp, hơi noise film xu hướng kinh điển, vệt sáng rò rỉ ánh nắng hoài cổ dịu dàng.'
    }
    if (name.includes('retro')) {
      return 'Tông xanh – vàng đem lại nhiều hoài niệm, sự cổ điển với sự hoài mong về quá khứ.'
    }
    if (name.includes('sakura') || name.includes('anime')) {
      return 'Họa tiết cánh hoa anh đào bồng bềnh, bảng màu hồng phấn dịu ngọt và các nét vẽ kawaii đáng yêu.'
    }
    if (name.includes('ballon') || name.includes('y2k')) {
      return 'Tông màu xanh hồng mang lại cảm giác ảo diệu, sự nhí nhảnh đi kèm với sự tươi trẻ tạo cảm giác thú vị.'
    }
    return (frame as any).description || 'Khung ảnh thiết kế độc quyền chất lượng cao, tối ưu cho máy in photobooth chuẩn màu.'
  }

  const getFrameBgClass = (frame: Frame, isSelected: boolean) => {
    const name = frame.name.toLowerCase()
    if (isSelected) return 'bg-[#2d3139]'
    if (name.includes('retro')) return 'bg-[#18393e]'
    if (name.includes('anime') || name.includes('pastel') || name.includes('y2k') || name.includes('ballon')) {
      return 'bg-gradient-to-b from-pink-50/70 to-sky-100/70'
    }
    if (name.includes('minimal')) return 'bg-[#e5ded6]'
    return 'bg-[#2d3139]'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 animate-fadeIn">
        <Spin size="large" />
        <p className="text-fuchsia-600 font-semibold text-sm animate-pulse">
          Đang tải bộ sưu tập khung trang trí...
        </p>
      </div>
    )
  }

  if (error) {
    return <Alert type="error" message={error} className="my-8 max-w-2xl mx-auto rounded-2xl" />
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-24">
      {/* ── 1. Hero Card (Figma Bước 2) ── */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-sm relative overflow-hidden mb-8">
        {/* Soft baby blue aura on the right */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-[#89CFF0]/25 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          {/* Traffic indicator dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c026d3]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#89CFF0]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#C0C0C0]" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 mb-2">
          <span className="bg-gradient-to-r from-[#d946ef] via-[#9333ea] to-[#2563eb] bg-clip-text text-transparent">
            Bước 2: Chọn Style &amp; Họa Tiết Khung
          </span>
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-2xl leading-relaxed">
          Khoác lên bức ảnh phong cách Y2K Cyber, Retro Vintage, Anime hay Futuristic độc quyền. Mỗi theme được thiết kế chuẩn tỉ lệ và có sự nổi bật riêng. Đa dạng thể loại để lựa chọn.
        </p>
      </div>

      {/* ── 2. Style Filter Tags ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="relative w-full md:w-80 mb-2 md:mb-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm kiếm mẫu khung..."
            className="w-full bg-white/90 border border-[#E5E4E2] focus:border-[#89CFF0] rounded-full px-5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#89CFF0]/30 shadow-sm"
          />
        </div>
        {tags.map((tag) => {
          const isActive = selectedTag === tag.key
          return (
            <button
              key={tag.key}
              onClick={() => setSelectedTag(tag.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${isActive
                  ? 'bg-[#c026d3] text-white shadow-md shadow-fuchsia-500/20 scale-105'
                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80 shadow-2xs'
                }`}
            >
              {tag.icon && <span>{tag.icon}</span>}
              <span>{tag.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── 3. Frame Cards Grid (3 Columns) ── */}
      {filteredFrames.length === 0 ? (
        <div className="text-center py-20 bg-white/70 backdrop-blur-sm rounded-[32px] border border-[#E5E4E2] shadow-sm">
          <p className="text-5xl mb-4 opacity-50">🎨</p>
          <p className="text-gray-500 text-sm font-medium">Không tìm thấy frame nào phù hợp với bộ lọc hiện tại.</p>
          <button
            onClick={() => setSelectedTag('all')}
            className="mt-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold transition-all text-gray-700 cursor-pointer"
          >
            Xem tất cả frame
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredFrames.map((frame, idx) => {
            const isSelected = selectedFrame?.id === frame.id
            const badge = getFrameBadge(frame)
            const code = getFrameCode(frame, idx)
            const desc = getFrameDescription(frame)
            const bgClass = getFrameBgClass(frame, isSelected)

            return (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`rounded-[28px] p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between ${isSelected
                    ? 'bg-white border-2 border-[#d946ef] ring-4 ring-fuchsia-100 shadow-[0_10px_30px_rgba(217,70,239,0.15)] scale-[1.01]'
                    : 'bg-white border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    {isSelected ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#d946ef] text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        ĐANG CHỌN
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}>
                        {badge.label}
                      </span>
                    )}
                    <span className="text-gray-400 text-[10px] font-mono font-medium">{code}</span>
                  </div>

                  {/* Frame Preview Image Container */}
                  <div className={`rounded-2xl p-4 flex items-center justify-center min-h-[220px] aspect-[4/3] relative overflow-hidden mb-4 ${bgClass}`}>
                    <img
                      src={frame.image_url || frame.thumbnail_url}
                      alt={frame.name}
                      className="max-h-full max-w-full object-contain drop-shadow-md rounded-sm transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = frame.thumbnail_url || frame.image_url
                      }}
                    />
                    {isSelected && (
                      <span className="absolute bottom-2.5 left-3 text-white/40 text-xs">☆</span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-extrabold text-base md:text-lg text-gray-900 tracking-tight">
                        {frame.name}
                      </h3>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full border-2 border-[#d946ef] text-[#d946ef] flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {isSelected ? (
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-[#c026d3] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>✓</span> Đã Áp Dụng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFrame(frame)
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#ececec] hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Áp Dụng Style</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 4. Floating Bottom Summary Bar (Figma Bước 2) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-[#E5E4E2] flex items-center justify-between gap-3 md:gap-6">
          {/* Left button */}
          <button
            onClick={onBack}
            className="px-4 md:px-5 py-2.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-gray-700 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>←</span>
            <span>Quay Lại Chọn Size</span>
          </button>

          {/* Center info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d946ef] flex-shrink-0" />
            <div className="text-xs md:text-sm text-gray-900 truncate">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block sm:inline sm:mr-1">
                KHUNG ĐÃ CHỌN:
              </span>
              <span className="font-bold">{selectedFrame?.name || 'Chưa chọn'}</span>
              <span className="text-gray-500 font-normal ml-1">
                ({selectedPackage?.title || 'Dải Strip'} • {selectedPackage?.shotsCount || 4} ảnh)
              </span>
            </div>
          </div>

          {/* Right button */}
          <button
            onClick={() => selectedFrame && onSelect(selectedFrame)}
            disabled={!selectedFrame}
            className="px-6 md:px-8 py-3 rounded-full bg-gradient-to-r from-[#177292] via-[#5264aa] to-[#b314b9] hover:opacity-95 text-white font-bold text-xs md:text-sm shadow-[0_4px_20px_rgba(179,20,185,0.35)] hover:shadow-[0_6px_25px_rgba(179,20,185,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>TIẾP TỤC: VÀO BUỒNG CHỤP (BƯỚC 3)</span>
            <span>📷</span>
          </button>
        </div>
      </div>
    </div>
  )
}
