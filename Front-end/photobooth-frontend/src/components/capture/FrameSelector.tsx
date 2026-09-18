import { useEffect, useState } from 'react'
import { Spin, Alert } from 'antd'
import { getFrames } from '@/api/capture.api'
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
    getFrames()
      .then((data) => {
        setFrames(data)
        if (data.length > 0) {
          setSelectedFrame(data[0])
        }
      })
      .catch(() => setError('Không tải được danh sách frame. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredFrames = frames.filter((frame) => {
    const matchesSearch = frame.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedTag === 'all') return matchesSearch
    return matchesSearch && (frame.name.toLowerCase().includes(selectedTag) || frame.category === selectedTag)
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spin size="large" />
        <p className="text-pink-300 animate-pulse">Đang tải bộ sưu tập frame trang trí...</p>
      </div>
    )
  }

  if (error) {
    return <Alert type="error" message={error} className="my-8" />
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn">
      {/* Back button & Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm font-semibold transition-all flex items-center gap-2"
        >
          <span>← Quay lại chọn gói</span>
        </button>

        {selectedPackage && (
          <div className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
            Đã chọn: {selectedPackage.title}
          </div>
        )}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Bước 2: Chọn Style & Mẫu Khung Decor ✨
        </h2>
        <p className="text-white/60 text-sm">
          Khám phá bộ sưu tập khung độc quyền cho photobooth của bạn
        </p>
      </div>

      {/* Search & Tag filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm kiếm mẫu khung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-pink-500 transition-all"
          />
          <span className="absolute left-3.5 top-3 text-white/40 text-sm">🔍</span>
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
          {tags.map((tag) => (
            <button
              key={tag.key}
              onClick={() => setSelectedTag(tag.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedTag === tag.key
                  ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(233,69,96,0.5)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Cards Grid */}
      {filteredFrames.length === 0 ? (
        <div className="text-center py-16 text-white/40 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-4xl mb-3">🎨</p>
          <p className="text-sm">Không tìm thấy frame nào phù hợp với tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
          {filteredFrames.map((frame) => {
            const isSelected = selectedFrame?.id === frame.id
            return (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-pink-500 shadow-[0_0_25px_rgba(233,69,96,0.6)] scale-[1.03] bg-pink-500/10'
                    : 'border-white/10 hover:border-pink-400/60 bg-white/5 hover:scale-[1.01]'
                }`}
              >
                {/* Check icon */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-lg animate-bounce">
                    ✓
                  </div>
                )}

                {/* Frame Preview Image */}
                <div className="aspect-[3/4] overflow-hidden bg-slate-900/50 p-2 flex items-center justify-center">
                  <img
                    src={frame.thumbnail_url || frame.image_url}
                    alt={frame.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>

                {/* Info Footer */}
                <div className="p-3 bg-slate-950/60 backdrop-blur-md text-center">
                  <p className="text-white font-bold text-sm truncate">{frame.name}</p>
                  <p className="text-pink-400/80 text-[11px] font-medium mt-0.5">
                    {frame.aspect_ratio || '1x4 Strip'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm Selection Button */}
      {selectedFrame && (
        <div className="flex justify-center pt-4 border-t border-white/10">
          <button
            onClick={() => onSelect(selectedFrame)}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-base shadow-[0_0_30px_rgba(233,69,96,0.6)] hover:shadow-[0_0_40px_rgba(233,69,96,0.8)] hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <span>BẮT ĐẦU CHỤP ẢNH</span>
            <span className="text-xl">📸</span>
          </button>
        </div>
      )}
    </div>
  )
}
