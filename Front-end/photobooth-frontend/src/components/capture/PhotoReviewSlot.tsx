import { useState } from 'react'

interface PhotoReviewSlotProps {
  photos: HTMLImageElement[]
  onConfirm: (orderedPhotos: HTMLImageElement[]) => void
  onRetake: () => void
}

export default function PhotoReviewSlot({ photos, onConfirm, onRetake }: PhotoReviewSlotProps) {
  // Ordered array of photos for slots
  const [photoList, setPhotoList] = useState<HTMLImageElement[]>([...photos])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Swap two items in array
  function handleSwap(indexA: number, indexB: number) {
    const updated = [...photoList]
    const temp = updated[indexA]
    updated[indexA] = updated[indexB]
    updated[indexB] = temp
    setPhotoList(updated)
  }

  function handleSlotClick(idx: number) {
    if (selectedIndex === null) {
      setSelectedIndex(idx)
    } else if (selectedIndex === idx) {
      setSelectedIndex(null)
    } else {
      handleSwap(selectedIndex, idx)
      setSelectedIndex(null)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Bước 4: Review & Sắp Xếp Vị Trí Slot Ảnh 🔄
        </h2>
        <p className="text-white/60 text-sm">
          Click chọn 2 ảnh bất kỳ để hoán đổi vị trí thứ tự xuất hiện trên khung hình
        </p>
      </div>

      {/* Grid of photo slots */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {photoList.map((photo, idx) => {
          const isSelected = selectedIndex === idx
          return (
            <div
              key={idx}
              onClick={() => handleSlotClick(idx)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-pink-500 shadow-[0_0_25px_rgba(233,69,96,0.7)] scale-105 ring-4 ring-pink-500/30'
                  : 'border-white/15 hover:border-pink-400/60 hover:scale-[1.02] bg-white/5'
              }`}
            >
              <div className="aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={photo.src}
                  alt={`Slot ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Slot Badge */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-white font-bold text-xs border border-white/10">
                Slot #{idx + 1}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="bg-pink-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    Đang chọn (Click ô khác để đổi)
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <button
          onClick={onRetake}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-semibold text-sm transition-all flex items-center gap-2"
        >
          <span>📸 Chụp Lại Bộ Ảnh Mới</span>
        </button>

        <button
          onClick={() => onConfirm(photoList)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-base shadow-[0_0_25px_rgba(233,69,96,0.6)] hover:shadow-[0_0_35px_rgba(233,69,96,0.8)] hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span>SANG BƯỚC HẬU KỲ & BỘ LỌC</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  )
}
