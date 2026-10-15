import { useEffect, useRef, useState, useCallback } from 'react'
import { Spin } from 'antd'
import gifshot from 'gifshot'
import type { PackageOption, Frame } from '@/types/capture.types'
import baseFramesData from '@/data/base_frames.json'

interface CameraCaptureProps {
  selectedPackage: PackageOption
  selectedFrame: Frame
  onComplete: (photos: string[], recordingBlob?: Blob, gifBlob?: Blob) => void
  onBack: () => void
}

// Sound Synthesizer using Web Audio API
const playBeep = (freq = 880, duration = 0.1) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const audioCtx = new AudioCtx()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch {}
}

const playShutterSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const audioCtx = new AudioCtx()
    const bufferSize = audioCtx.sampleRate * 0.08
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = audioCtx.createBufferSource()
    noise.buffer = buffer
    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08)
    noise.connect(gain)
    gain.connect(audioCtx.destination)
    noise.start()
  } catch {}
}

export default function CameraCapture({
  selectedPackage,
  selectedFrame,
  onComplete,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraDeviceName, setCameraDeviceName] = useState<string>('FaceTime HD Camera (Hoạt động tốt)')
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // MediaRecorder for video BTS
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])

  // Capture State Machine
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'snap' | 'break' | 'finishing'>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [photos, setPhotos] = useState<string[]>([])
  const shotsRequired = selectedPackage.shotsCount || 4

  // Determine slot aspect ratio
  const layoutToUse =
    selectedFrame.layout_config && selectedFrame.layout_config.slots?.length > 0
      ? selectedFrame.layout_config
      : (Array.isArray(baseFramesData) ? baseFramesData : [baseFramesData]).find(
          (b: any) => b.id === selectedFrame.aspect_ratio || b.id === '1x4'
        )?.layout_config

  const firstSlot = layoutToUse?.slots?.[0]
  const slotRatio = firstSlot ? firstSlot.width / firstSlot.height : 3 / 4

  // Initialize Camera
  useEffect(() => {
    let activeStream: MediaStream | null = null

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
          audio: false,
        })
        setStream(mediaStream)
        activeStream = mediaStream

        const track = mediaStream.getVideoTracks()[0]
        if (track && track.label) {
          setCameraDeviceName(`${track.label} (Hoạt động tốt)`)
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Lỗi truy cập camera:', err)
        setError('Không thể truy cập camera. Vui lòng cấp quyền webcam và thử lại.')
      }
    }

    startCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Capture frame from video element
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/png')
        setPhotos((prev) => [...prev, dataUrl])
      }
    }
  }, [])

  // Finish capture sequence: stop video, create GIF, navigate to Review
  const finishCaptureSequence = useCallback(() => {
    setIsCapturing(false)
    setPhase('finishing')
    setIsProcessing(true)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setTimeout(() => {
      setPhotos((currentPhotos) => {
        const videoBlob =
          recordedChunksRef.current.length > 0
            ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
            : undefined

        gifshot.createGIF(
          {
            images: currentPhotos,
            gifWidth: 400,
            gifHeight: Math.round(400 / slotRatio),
            interval: 0.5,
            numFrames: shotsRequired,
          },
          (obj) => {
            let gifBlob: Blob | undefined = undefined
            if (!obj.error) {
              const byteString = atob(obj.image.split(',')[1])
              const mimeString = obj.image.split(',')[0].split(':')[1].split(';')[0]
              const ab = new ArrayBuffer(byteString.length)
              const ia = new Uint8Array(ab)
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
              }
              gifBlob = new Blob([ab], { type: mimeString })
            } else {
              console.error('Tạo GIF lỗi:', obj.errorMsg)
            }

            setIsProcessing(false)
            onComplete(currentPhotos, videoBlob, gifBlob)
          }
        )

        return currentPhotos
      })
    }, 500)
  }, [onComplete, shotsRequired, slotRatio])

  // Countdown timer for taking a shot (5 seconds)
  const runShotCountdown = useCallback(
    (shotIdx: number) => {
      setCurrentShotIndex(shotIdx)
      setPhase('snap')
      let timeLeft = 5
      setCountdown(timeLeft)
      if (soundEnabled) playBeep(880, 0.1)

      const timer = setInterval(() => {
        timeLeft -= 1
        if (timeLeft > 0) {
          setCountdown(timeLeft)
          if (soundEnabled) playBeep(timeLeft === 1 ? 1100 : 880, 0.12)
        } else {
          clearInterval(timer)
          setCountdown(null)

          // Flash screen + Sound
          setFlash(true)
          if (soundEnabled) playShutterSound()
          setTimeout(() => setFlash(false), 220)

          // Snapshot frame
          captureFrame()

          // Check if more shots required
          if (shotIdx + 1 < shotsRequired) {
            // Run 3s preparation interval before next shot
            runBreakCountdown(shotIdx + 1)
          } else {
            finishCaptureSequence()
          }
        }
      }, 1000)
    },
    [captureFrame, finishCaptureSequence, shotsRequired, soundEnabled]
  )

  // Countdown timer for break / preparing new pose (3 seconds)
  const runBreakCountdown = useCallback(
    (nextShotIdx: number) => {
      setPhase('break')
      let timeLeft = 3
      setCountdown(timeLeft)
      if (soundEnabled) playBeep(660, 0.1)

      const breakTimer = setInterval(() => {
        timeLeft -= 1
        if (timeLeft > 0) {
          setCountdown(timeLeft)
          if (soundEnabled) playBeep(660, 0.1)
        } else {
          clearInterval(breakTimer)
          setCountdown(null)
          // Proceed to next shot with 5s countdown
          runShotCountdown(nextShotIdx)
        }
      }, 1000)
    },
    [runShotCountdown, soundEnabled]
  )

  // Start the entire capture sequence
  const startSequence = () => {
    if (isCapturing || photos.length >= shotsRequired || !stream) return
    setIsCapturing(true)
    setPhotos([])

    recordedChunksRef.current = []
    const options = { mimeType: 'video/webm; codecs=vp9' }
    try {
      const recorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined
      )
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }
      recorder.start()
    } catch (e) {
      console.warn('MediaRecorder error:', e)
    }

    // Begin first shot with 5s countdown
    runShotCountdown(0)
  }

  // Render mockup grid slot in right sidebar
  const renderMockupSlot = (slotIdx: number) => {
    const photo = photos[slotIdx]
    if (photo) {
      return (
        <div
          key={slotIdx}
          className="w-full aspect-square rounded-lg overflow-hidden bg-black shadow-inner relative"
        >
          <img src={photo} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
          <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white font-mono px-1 rounded">
            #{slotIdx + 1}
          </span>
        </div>
      )
    }
    return (
      <div
        key={slotIdx}
        className="w-full aspect-square rounded-lg bg-[#8c8c94] text-white/90 text-xs font-bold flex items-center justify-center tracking-wider shadow-inner"
      >
        SLOT #{String(slotIdx + 1).padStart(2, '0')}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg hover:bg-red-600 transition-all cursor-pointer"
          >
            Tải Lại Trang
          </button>
        </div>
      ) : (
        <>
          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── Left Column: Live Webcam Preview ── */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="relative rounded-[28px] overflow-hidden bg-black shadow-xl aspect-[4/3] flex items-center justify-center border-2 border-white/60">
                {/* Live Webcam Video (Mirrored) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Top-Left Badge: REC BTS */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-emerald-600 flex items-center gap-2 shadow-sm border border-white/80">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>REC BTS (HẬU TRƯỜNG ĐANG QUAY)</span>
                  </div>
                </div>

                {/* Top-Right Badge: Active Shot Indicator */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-gradient-to-r from-[#FF00FF] to-[#9333ea] text-white px-3.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1.5">
                    <span>🖼️</span>
                    <span>
                      Ô ĐANG CHỤP: {Math.min(currentShotIndex + 1, shotsRequired)} / {shotsRequired}
                    </span>
                  </div>
                </div>

                {/* Flash Overlay Effect */}
                {flash && (
                  <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
                )}

                {/* Countdown Overlay (5s Snap Countdown) */}
                {phase === 'snap' && countdown !== null && (
                  <div className="absolute inset-0 z-40 bg-black/35 backdrop-blur-[2px] flex flex-col items-center justify-center animate-fadeIn">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#89CFF0] flex items-center justify-center shadow-[0_0_50px_rgba(137,207,240,0.6)] bg-black/40">
                      <span className="text-6xl sm:text-7xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-pulse">
                        {countdown}
                      </span>
                    </div>
                    <span className="mt-3 px-4 py-1 rounded-full bg-black/60 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md border border-white/20">
                      Chuẩn bị chụp ảnh {currentShotIndex + 1}
                    </span>
                  </div>
                )}

                {/* Break Overlay (3s Preparation Interval) */}
                {phase === 'break' && countdown !== null && (
                  <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center animate-fadeIn">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-black text-[#FF00FF] drop-shadow-md mb-1 uppercase tracking-wider">
                        ✨ Chuẩn Bị Kiểu Dáng Mới!
                      </div>
                      <div className="w-24 h-24 rounded-full border-4 border-[#FF00FF] flex items-center justify-center shadow-[0_0_40px_rgba(255,0,255,0.6)] bg-black/40 mx-auto my-2">
                        <span className="text-5xl sm:text-6xl font-black text-white animate-bounce">
                          {countdown}
                        </span>
                      </div>
                      <span className="px-4 py-1 rounded-full bg-black/60 text-pink-200 font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/20">
                        Nghỉ 3 giây tạo dáng
                      </span>
                    </div>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <Spin size="large" />
                    <h3 className="mt-4 text-xl font-black text-white animate-pulse">
                      ĐANG TẠO DẢI ẢNH &amp; LIVE GIF...
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">Đang hoàn thiện các khung hình đẹp nhất của bạn</p>
                  </div>
                )}
              </div>

              {/* Tips Bar below Webcam */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between border border-[#E5E4E2] shadow-2xs mt-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-base flex-shrink-0">
                    💡
                  </div>
                  <div className="text-xs text-gray-700">
                    <span className="font-bold text-gray-900">Mẹo nhỏ từ KH BOOTH: </span>
                    <span className="text-gray-500">
                      Giữ mắt nhìn thẳng ống kính camera thay vì màn hình để ánh nhìn cuốn hút nhất.
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-semibold flex-shrink-0 border border-gray-200">
                  ⛶ GÓC 4:3 CHUẨN KOREA
                </div>
              </div>
            </div>

            {/* ── Right Column: Sidebar Tiến Trình Dải Ảnh ── */}
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-sm rounded-[28px] p-6 border border-[#E5E4E2] shadow-sm flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100">
                  <span className="text-[#c026d3] text-lg font-bold">⊟</span>
                  <h3 className="font-black text-sm text-gray-800 tracking-wider uppercase">
                    TIẾN TRÌNH DẢI ẢNH
                  </h3>
                </div>

                {/* Mockup Frame Preview Container */}
                <div className="bg-[#f4f4f6] rounded-2xl p-4 my-3 flex flex-col items-center border border-gray-200/60 shadow-inner">
                  {/* Slots Grid */}
                  <div
                    className={`w-full max-w-[240px] gap-2 ${
                      shotsRequired === 4
                        ? 'grid grid-cols-2'
                        : shotsRequired === 6
                        ? 'grid grid-cols-3'
                        : shotsRequired === 8
                        ? 'grid grid-cols-4'
                        : 'flex flex-col'
                    }`}
                  >
                    {Array.from({ length: shotsRequired }).map((_, i) => renderMockupSlot(i))}
                  </div>

                  {/* KH Booth Branding */}
                  <div className="mt-4 font-black text-gray-900 tracking-tight text-base">
                    KH Booth
                  </div>
                </div>
              </div>

              {/* Action Button & Note */}
              <div className="mt-4">
                {!isCapturing && !isProcessing ? (
                  <button
                    onClick={startSequence}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#177292] via-[#5264aa] to-[#b314b9] hover:opacity-95 text-white font-extrabold text-sm md:text-base shadow-[0_6px_25px_rgba(179,20,185,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>BẮT ĐẦU CHỤP TỰ ĐỘNG</span>
                    <span className="text-lg">📷</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>ĐANG CHỤP TỰ ĐỘNG...</span>
                  </button>
                )}

                {/* Info Note */}
                <div className="bg-fuchsia-50/70 border border-fuchsia-100 rounded-2xl p-3 text-xs text-gray-600 mt-3 flex items-start gap-2.5">
                  <span className="text-base">⏱️</span>
                  <div className="leading-relaxed">
                    Hệ thống sẽ tự động chụp liên tiếp {shotsRequired} bức ảnh với{' '}
                    <span className="text-[#d946ef] font-bold">khoảng nghỉ 3 giây</span> giữa mỗi kiểu để bạn kịp tạo dáng mới!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sound Toggle (Right Aligned) */}
          <div className="flex justify-end mt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white/70 px-4 py-1.5 rounded-full border border-gray-200 shadow-2xs">
              <span>Âm thanh chụp:</span>
              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  soundEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                {soundEnabled ? '🔊 Bật' : '🔇 Tắt'}
              </button>
            </div>
          </div>

          {/* Device Webcam Status Bar */}
          <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-full px-5 py-3 border border-[#E5E4E2] shadow-2xs flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm">📹</span>
            <span className="text-xs text-gray-600 font-medium">Thiết bị Webcam sẵn sàng:</span>
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
              {cameraDeviceName}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
