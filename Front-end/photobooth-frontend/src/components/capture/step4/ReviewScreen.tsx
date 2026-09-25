import { useState, useRef, useEffect, useCallback } from 'react'

interface ReviewScreenProps {
  photos: string[]
  onPhotosChange?: (updatedPhotos: string[]) => void
  onRetake: () => void
  onNext: () => void
}

export default function ReviewScreen({
  photos,
  onPhotosChange,
  onRetake,
  onNext,
}: ReviewScreenProps) {
  // Retake single photo modal state
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null)
  const [modalStream, setModalStream] = useState<MediaStream | null>(null)
  const [modalCountdown, setModalCountdown] = useState<number | null>(null)
  const [modalFlash, setModalFlash] = useState(false)
  const modalVideoRef = useRef<HTMLVideoElement>(null)
  const modalCanvasRef = useRef<HTMLCanvasElement>(null)

  // Start webcam when retake modal opens
  useEffect(() => {
    let activeStream: MediaStream | null = null

    if (retakeIndex !== null) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
          audio: false,
        })
        .then((s) => {
          setModalStream(s)
          activeStream = s
          if (modalVideoRef.current) {
            modalVideoRef.current.srcObject = s
          }
        })
        .catch((err) => console.error('Lỗi webcam khi chụp lại:', err))
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [retakeIndex])

  // Countdown and capture single photo
  const handleStartSingleRetake = useCallback(() => {
    if (modalCountdown !== null) return
    let timeLeft = 5
    setModalCountdown(timeLeft)

    const timer = setInterval(() => {
      timeLeft -= 1
      if (timeLeft > 0) {
        setModalCountdown(timeLeft)
      } else {
        clearInterval(timer)
        setModalCountdown(null)

        // Flash screen
        setModalFlash(true)
        setTimeout(() => setModalFlash(false), 200)

        // Capture frame from modal video
        if (modalVideoRef.current && modalCanvasRef.current && retakeIndex !== null) {
          const video = modalVideoRef.current
          const canvas = modalCanvasRef.current
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const newPhotoUrl = canvas.toDataURL('image/png')

            const updated = [...photos]
            updated[retakeIndex] = newPhotoUrl
            if (onPhotosChange) {
              onPhotosChange(updated)
            }
          }
        }

        // Close modal
        setTimeout(() => {
          setRetakeIndex(null)
        }, 300)
      }
    }, 1000)
  }, [modalCountdown, onPhotosChange, photos, retakeIndex])

  const handleCloseModal = () => {
    setModalCountdown(null)
    setRetakeIndex(null)
    if (modalStream) {
      modalStream.getTracks().forEach((t) => t.stop())
      setModalStream(null)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-24">
      {/* ── 1. Hero Card (Figma Bước 4) ── */}
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
              ❄ Y2K Gloss V2
            </span>
            <span className="px-3 py-1 rounded-full bg-white/90 text-gray-600 text-xs font-semibold border border-gray-200/80 shadow-2xs">
              ⛶ Phóng to dải
            </span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 mb-2">
          <span className="bg-gradient-to-r from-[#d946ef] via-[#9333ea] to-[#2563eb] bg-clip-text text-transparent">
            Bước 4: Review Ảnh &amp; Chụp Lại
          </span>
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-2xl leading-relaxed">
          Kiểm tra từng khoảnh khắc vừa chụp. Bạn có thể nhấn trực tiếp vào từng ô ảnh hoặc di chuyển đến từng ô sẽ hiển thị ra nút &ldquo; Chụp lại &rdquo;.
        </p>
      </div>

      {/* ── 2. Photos Grid (2x2 Layout matching Figma) ── */}
      <div className="bg-white/70 backdrop-blur-sm rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-sm mb-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => setRetakeIndex(i)}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-black shadow-md border-2 border-white/80 cursor-pointer transition-all duration-300 hover:shadow-xl"
            >
              {/* Photo Image */}
              <img
                src={photo}
                alt={`Khoảnh khắc ${i + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />

              {/* Top-Right Badge: Đã chụp */}
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-emerald-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span>✓</span>
                  <span>Đã chụp</span>
                </span>
              </div>

              {/* Bottom-Left Number Badge */}
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  #{i + 1}
                </span>
              </div>

              {/* Hover Dark Overlay with Centered "Chụp lại" Button */}
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRetakeIndex(i)
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0e7490] hover:bg-[#0891b2] text-white font-extrabold text-xs shadow-lg transition-transform transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Chụp lại</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Bottom Bar (Figma Bước 4) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-[#E5E4E2] flex items-center justify-between gap-3 md:gap-6">
          {/* Left: Retake All Button */}
          <button
            onClick={onRetake}
            className="px-5 py-2.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-gray-700 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>🔄</span>
            <span>Chụp lại toàn bộ các ô</span>
          </button>

          {/* Right: Continue to Filter Step Button */}
          <button
            onClick={onNext}
            className="px-7 md:px-9 py-3 rounded-full bg-gradient-to-r from-[#0e7490] via-[#6366f1] to-[#c026d3] hover:opacity-95 text-white font-bold text-xs md:text-sm shadow-[0_4px_20px_rgba(192,38,211,0.35)] hover:shadow-[0_6px_25px_rgba(192,38,211,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>ẢNH ĐÃ ĐẸP! SANG HẬU KỲ</span>
            <span className="text-base">➔</span>
          </button>
        </div>
      </div>

      {/* ── 4. Single Photo Retake Modal ── */}
      {retakeIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 relative">
            <canvas ref={modalCanvasRef} className="hidden" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Chụp Lại Ảnh #{retakeIndex + 1}
                </h3>
                <p className="text-xs text-gray-500">Đếm ngược 5 giây khi bắt đầu chụp</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Webcam Preview in Modal */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center mb-5">
              <video
                ref={modalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {modalFlash && (
                <div className="absolute inset-0 bg-white z-50 pointer-events-none" />
              )}

              {modalCountdown !== null && (
                <div className="absolute inset-0 z-40 bg-black/40 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#89CFF0] flex items-center justify-center bg-black/50 shadow-lg">
                    <span className="text-6xl font-black text-white animate-pulse">
                      {modalCountdown}
                    </span>
                  </div>
                  <span className="text-white text-xs font-bold mt-2 uppercase tracking-wider">
                    Đang đếm ngược...
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons inside Modal */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleStartSingleRetake}
                disabled={modalCountdown !== null}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#c026d3] text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {modalCountdown !== null ? 'Đang chụp...' : 'Bắt Đầu Đếm Ngược 5s 📸'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
