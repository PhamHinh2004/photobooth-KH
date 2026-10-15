import { useEffect, useRef, useState } from 'react'

interface CameraCaptureProps {
  totalShots: number
  onComplete: (photos: HTMLImageElement[]) => void
  onBack: () => void
}

export default function CameraCapture({ totalShots, onComplete, onBack }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timerDelay, setTimerDelay] = useState<number>(3) // 3s, 5s, 10s
  const [isMirror, setIsMirror] = useState<boolean>(true)
  const [shotIndex, setShotIndex] = useState<number>(0)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [flash, setFlash] = useState(false)

  // Request camera stream
  useEffect(() => {
    let stream: MediaStream | null = null

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setError('Không thể truy cập camera. Vui lòng cấp quyền camera trình duyệt và thử lại.')
      }
    }

    initCamera()

    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function handleVideoCanPlay() {
    setCameraReady(true)
  }

  // Capture current video frame onto hidden canvas
  function captureFrame(): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const video = videoRef.current!
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720

      const ctx = canvas.getContext('2d')!
      if (isMirror) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0)

      const img = new Image()
      img.onload = () => resolve(img)
      img.src = canvas.toDataURL('image/png')
    })
  }

  // Sequence: countdown -> photo -> repeat N times
  async function startCaptureSequence() {
    const photos: HTMLImageElement[] = []
    const previews: string[] = []
    setCapturedPhotos([])

    for (let i = 0; i < totalShots; i++) {
      setShotIndex(i + 1)

      // Countdown with chosen timer delay
      for (let c = timerDelay; c > 0; c--) {
        setCountdown(c)
        await new Promise((r) => setTimeout(r, 1000))
      }

      // Flash effect
      setCountdown(0)
      setFlash(true)
      await new Promise((r) => setTimeout(r, 150))
      setFlash(false)

      const photo = await captureFrame()
      photos.push(photo)
      previews.push(photo.src)
      setCapturedPhotos([...previews])

      // Inter-shot pause
      await new Promise((r) => setTimeout(r, 600))
    }

    setCountdown(null)
    onComplete(photos)
  }

  const isCapturing = countdown !== null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center animate-fadeIn">
        <div className="text-6xl">📷</div>
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-6 max-w-sm">
          <p className="text-red-300 font-medium text-sm">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-white/20 text-white/80 hover:border-white/40 text-sm font-semibold transition-colors"
        >
          ← Quay lại chọn style
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          disabled={isCapturing}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold transition-colors disabled:opacity-30 flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Đổi Mẫu Khung</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Mirror toggle */}
          <button
            onClick={() => setIsMirror(!isMirror)}
            disabled={isCapturing}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isMirror
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                : 'bg-white/5 border-white/15 text-white/60'
            }`}
            title="Lật hình dạng gương"
          >
            🪞 Gương: {isMirror ? 'Bật' : 'Tắt'}
          </button>

          {/* Timer Selector */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10 text-xs">
            <span className="px-2 text-white/50 font-medium">⏱️ Hẹn giờ:</span>
            {[3, 5, 10].map((t) => (
              <button
                key={t}
                onClick={() => setTimerDelay(t)}
                disabled={isCapturing}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timerDelay === t
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Viewport & Live Thumbnails grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Camera viewport (3 columns on large screens) */}
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/15 aspect-[16/10] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleVideoCanPlay}
            className="w-full h-full object-cover"
            style={{ transform: isMirror ? 'scaleX(-1)' : 'none' }}
          />

          {/* Flash overlay */}
          {flash && (
            <div
              className="absolute inset-0 bg-white animate-ping"
              style={{ animationDuration: '0.15s', animationIterationCount: 1 }}
            />
          )}

          {/* Countdown overlay */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div
                key={countdown}
                className="text-white font-black drop-shadow-[0_0_35px_rgba(233,69,96,0.9)] select-none animate-[ping_0.4s_ease-out]"
                style={{ fontSize: 'clamp(90px, 18vw, 170px)', lineHeight: 1 }}
              >
                {countdown}
              </div>
            </div>
          )}

          {/* Camera loading overlay */}
          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-pink-300 font-semibold text-sm animate-pulse flex items-center gap-2">
                <span>📷</span> Đang bật camera...
              </div>
            </div>
          )}

          {/* Progress Overlay Tag */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span>
              {isCapturing
                ? `Đang chụp ảnh ${shotIndex} / ${totalShots}`
                : `Sẵn sàng (${totalShots} ảnh)`}
            </span>
          </div>
        </div>

        {/* Live Thumbnails Side Column */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-3">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider text-center text-white/70 mb-1">
            Ảnh Đã Chụp ({capturedPhotos.length}/{totalShots})
          </h4>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {Array.from({ length: totalShots }).map((_, idx) => {
              const photoSrc = capturedPhotos[idx]
              return (
                <div
                  key={idx}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center ${
                    photoSrc
                      ? 'border-pink-500 shadow-[0_0_12px_rgba(233,69,96,0.3)] bg-black'
                      : 'border-white/10 border-dashed bg-white/5 text-white/30'
                  }`}
                >
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={`Shot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    #{idx + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Trigger Button */}
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={startCaptureSequence}
          disabled={isCapturing || !cameraReady}
          className={`w-full max-w-md py-4 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
            isCapturing || !cameraReady
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-[0_0_30px_rgba(233,69,96,0.6)] hover:shadow-[0_0_45px_rgba(233,69,96,0.8)] hover:scale-105 active:scale-95'
          }`}
        >
          {isCapturing ? (
            <span>📸 Đang đếm ngược chụp ảnh {shotIndex}/{totalShots}...</span>
          ) : (
            <>
              <span className="text-xl">📸</span>
              <span>{capturedPhotos.length === 0 ? 'BẮT ĐẦU CHỤP ẢNH' : 'CHỤP LẠI TOÀN BỘ'}</span>
            </>
          )}
        </button>

        <p className="text-white/40 text-xs mt-3">
          Màn hình sẽ tự động chuyển sang bước **Review & Xếp Slot** sau khi hoàn thành chụp {totalShots} ảnh.
        </p>
      </div>
    </div>
  )
}
