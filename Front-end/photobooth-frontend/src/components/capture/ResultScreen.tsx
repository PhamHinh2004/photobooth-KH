import { useState } from 'react'
import { savePhoto } from '@/api/capture.api'
import type { Frame, PhotoRecord } from '@/types/capture.types'

interface ResultScreenProps {
  processedCanvas: HTMLCanvasElement
  originalCanvas: HTMLCanvasElement
  frame: Frame
  customerId: string
  onReset: () => void
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = 'photobooth-kh.png') {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

export default function ResultScreen({
  processedCanvas,
  originalCanvas,
  frame,
  customerId,
  onReset,
}: ResultScreenProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<PhotoRecord | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const imgDataUrl = processedCanvas.toDataURL('image/png')

  // Generate QR code URL using public QR API
  const shareUrl = saved
    ? `${window.location.origin}/photo/${saved.share_token}`
    : window.location.href
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`

  async function handleDownload() {
    downloadCanvasAsPng(processedCanvas, `photobooth-${Date.now()}.png`)
  }

  async function handleSaveAndDownload() {
    if (saving || saved) return
    setSaving(true)
    setSaveError(null)

    try {
      downloadCanvasAsPng(processedCanvas, `photobooth-${Date.now()}.png`)

      const [processedBlob, originalBlob] = await Promise.all([
        canvasToBlob(processedCanvas),
        canvasToBlob(originalCanvas),
      ])

      const result = await savePhoto({
        customerId,
        frameId: frame.id,
        processedBlob,
        originalBlob,
      })
      setSaved(result)
    } catch {
      setSaveError('Lưu ảnh lên server thất bại. Ảnh đã được tải về máy của bạn!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Bước 6: Nhận Ảnh Kỷ Niệm & QR Code 🎁
        </h2>
        <p className="text-white/60 text-sm">
          Quét mã QR để lưu ảnh về điện thoại hoặc bấm Tải ảnh về máy lập tức
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
        {/* Left Column: Mobile Phone Mockup Preview */}
        <div className="flex flex-col items-center">
          <div className="relative border-4 border-slate-700/80 bg-slate-900 rounded-[35px] p-3 shadow-[0_0_50px_rgba(233,69,96,0.3)] max-w-xs">
            {/* Phone Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-700/80 rounded-b-xl z-20" />

            <div className="rounded-[25px] overflow-hidden bg-black aspect-[3/5] flex items-center justify-center p-2 pt-6">
              <img
                src={imgDataUrl}
                alt="Photobooth Final Result"
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
          <span className="text-white/40 text-xs mt-3">✨ Xem trước trên thiết bị di động</span>
        </div>

        {/* Right Column: QR Code & Actions */}
        <div className="flex flex-col gap-6 bg-white/5 border border-white/10 rounded-3xl p-6">
          {/* QR Code Box */}
          <div className="flex flex-col items-center p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
            <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-lg mb-3 flex items-center justify-center">
              <img src={qrCodeUrl} alt="QR Code Share Link" className="w-full h-full" />
            </div>
            <p className="text-white font-bold text-sm">Quét mã QR tải ngay</p>
            <p className="text-white/50 text-xs mt-0.5">Dùng ứng dụng Camera trên smartphone</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {!saved ? (
              <button
                onClick={handleSaveAndDownload}
                disabled={saving}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                  saving
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-[0_0_25px_rgba(233,69,96,0.5)] hover:shadow-[0_0_35px_rgba(233,69,96,0.8)] hover:scale-[1.02]'
                }`}
              >
                {saving ? (
                  <span>⏳ Đang lưu ảnh lên hệ thống...</span>
                ) : (
                  <>
                    <span>⬇️ TẢI ẢNH PNG VỀ MÁY & LƯU LỊCH SỬ</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center">
                <p className="text-emerald-300 font-bold text-sm">✅ Ảnh đã được lưu thành công vào lịch sử!</p>
                <p className="text-white/60 text-xs mt-1">Mã Token: {saved.share_token}</p>
              </div>
            )}

            {saved && (
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                ⬇️ Tải Lại File PNG
              </button>
            )}

            {saveError && (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs text-center">
                ⚠️ {saveError}
              </div>
            )}

            <button
              onClick={onReset}
              className="w-full py-3.5 rounded-2xl border border-white/15 text-white/70 hover:border-pink-500/60 hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>🔄 Bắt Đầu Lượt Chụp Mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
