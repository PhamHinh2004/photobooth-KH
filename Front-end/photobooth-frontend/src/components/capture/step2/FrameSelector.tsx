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
    { key: 'all', label: 'Tất cả Style' },
    { key: 'y2k', label: 'Y2K Retro 💖' },
    { key: 'pastel', label: 'Pastel Cute 🌸' },
    { key: 'minimal', label: 'Minimalist 🤍' },
    { key: 'dark', label: 'Moody Dark 🖤' },
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
    
    // Convert both to lowercase for safe matching
    const tagMatch = 
      frame.name.toLowerCase().includes(selectedTag) || 
      (frame.category && frame.category.toLowerCase() === selectedTag) ||
      (frame.tags && frame.tags.some(t => t.toLowerCase() === selectedTag))
      
    return tagMatch
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 animate-fadeIn">
        <Spin size="large" />
        <p className="text-pink-300 font-semibold text-sm animate-pulse">
          Đang tải bộ sưu tập khung trang trí...
        </p>
      </div>
    )
  }

  if (error) {
    return <Alert type="error" message={error} className="my-8 max-w-2xl mx-auto rounded-2xl" />
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn">
      {/* Back button & Selection Info Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white/80 font-bold text-sm transition-all flex items-center gap-2 border border-white/10 hover:border-white/20"
        >
          <span>←</span>
          <span>Quay lại chọn gói</span>
        </button>

        {selectedPackage && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/50 border border-pink-500/30 text-xs font-semibold shadow-inner">
            <span className="text-white/50">Gói đang chọn:</span>
            <span className="text-pink-400">{selectedPackage.title}</span>
            <span className="text-white/30 mx-1">|</span>
            <span className="text-pink-300/80">{selectedPackage.dimensions}</span>
          </div>
        )}
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
          Bước 2: Chọn Style & Mẫu Khung Decor ✨
        </h2>
        <p className="text-white/60 text-sm max-w-xl mx-auto">
          Lựa chọn giao diện bao ngoài cho dải ảnh của bạn. Dù là phong cách Y2K rực rỡ hay Minimalist tối giản, chúng tôi đều có.
        </p>
      </div>

      {/* Search & Tag filter bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10 bg-slate-900/40 p-3 rounded-[32px] border border-white/10 shadow-lg">
        {/* Search Input */}
        <div className="relative w-full lg:w-80 flex-shrink-0">
          <input
            type="text"
            placeholder="Tìm kiếm mẫu khung (vd: Sinh nhật)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 pl-12 rounded-3xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:border-pink-500 focus:bg-white/10 transition-all shadow-inner"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-base">🔍</span>
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-center lg:justify-end flex-1">
          {tags.map((tag) => (
            <button
              key={tag.key}
              onClick={() => setSelectedTag(tag.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                selectedTag === tag.key
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_15px_rgba(233,69,96,0.4)] scale-105'
                  : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white border border-white/5'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Cards Grid */}
      {filteredFrames.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-[32px] border border-white/5">
          <p className="text-5xl mb-4 opacity-50">🎨</p>
          <p className="text-white/60 text-sm font-medium">Không tìm thấy frame nào phù hợp với bộ lọc hiện tại.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedTag('all') }}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all text-white/80"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredFrames.map((frame) => {
            const isSelected = selectedFrame?.id === frame.id
            return (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`group relative rounded-[28px] overflow-hidden cursor-pointer border-2 transition-all duration-300 flex flex-col ${
                  isSelected
                    ? 'border-pink-500 shadow-[0_0_30px_rgba(233,69,96,0.4)] scale-[1.03] bg-gradient-to-b from-pink-500/10 to-slate-900/80 ring-2 ring-pink-500/30'
                    : 'border-white/5 hover:border-pink-400/50 hover:bg-white/10 bg-slate-900/50 hover:scale-[1.02]'
                }`}
              >
                {/* Check icon */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(233,69,96,0.6)] animate-bounce">
                    ✓
                  </div>
                )}

                {/* Frame Preview Image Container */}
                <div className="aspect-[3/4] relative overflow-hidden bg-black/40 p-4 flex items-center justify-center">
                  {/* Checkerboard background for transparency visualization */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }} />
                  
                  <img
                    src={frame.thumbnail_url || frame.image_url}
                    alt={frame.name}
                    className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  
                  {/* Subtle overlay on hover if not selected */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  )}
                </div>

                {/* Info Footer */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5 flex-1 flex flex-col justify-center text-center">
                  <p className="text-white font-bold text-sm truncate tracking-tight">{frame.name}</p>
                  <p className="text-pink-400/80 text-xs font-semibold mt-1 uppercase tracking-widest">
                    {frame.aspect_ratio || '1x4 Strip'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm Selection Action */}
      {selectedFrame && (
        <div className="flex justify-center pt-4 border-t border-white/10 sticky bottom-4 z-50">
          <button
            onClick={() => onSelect(selectedFrame)}
            className="px-12 py-4 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black text-lg shadow-[0_10px_40px_rgba(233,69,96,0.6)] hover:shadow-[0_15px_50px_rgba(233,69,96,0.8)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-3 backdrop-blur-md"
          >
            <span>BẮT ĐẦU CHỤP ẢNH</span>
            <span className="text-2xl animate-pulse">📸</span>
          </button>
        </div>
      )}
    </div>
  )
}
