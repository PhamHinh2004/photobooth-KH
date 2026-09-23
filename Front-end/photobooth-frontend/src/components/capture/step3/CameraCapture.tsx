import { useEffect, useRef, useState, useCallback } from 'react'
import gifshot from 'gifshot'
import type { PackageOption, Frame } from '@/types/capture.types'
import baseFramesData from '@/data/base_frames.json'

interface CameraCaptureProps {
  selectedPackage: PackageOption
  selectedFrame: Frame
  onComplete: (photos: string[], recordingBlob?: Blob, gifBlob?: Blob) => void
  onBack: () => void
}

export default function CameraCapture({
  selectedPackage,
  selectedFrame,
  onComplete,
  onBack,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // MediaRecorder for video
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])

  // Capturing State
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [photos, setPhotos] = useState<string[]>([])
  const shotsRequired = selectedPackage.shotsCount || 4

  // Determine slot aspect ratio
  const layoutToUse = (selectedFrame.layout_config && selectedFrame.layout_config.slots?.length > 0)
    ? selectedFrame.layout_config
    : (Array.isArray(baseFramesData) ? baseFramesData : [baseFramesData]).find((b: any) => b.id === selectedFrame.aspect_ratio || b.id === '1x4')?.layout_config;
  
  const firstSlot = layoutToUse?.slots?.[0];
  const slotRatio = firstSlot ? firstSlot.width / firstSlot.height : (3/4);

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
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Lỗi truy cập camera:', err)
        setError('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.')
      }
    }

    startCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Start the entire capture sequence
  const startSequence = () => {
    if (isCapturing || photos.length >= shotsRequired || !stream) return
    setIsCapturing(true)
    
    // Bắt đầu ghi hình video
    recordedChunksRef.current = []
    const options = { mimeType: 'video/webm; codecs=vp9' }
    try {
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined)
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

    takeNextShot(0)
  }

  // Recursive function to handle the sequence
  const takeNextShot = useCallback(
    (currentShotIndex: number) => {
      if (currentShotIndex >= shotsRequired) {
        finishCaptureSequence()
        return
      }

      let timeLeft = 5 // 5 seconds countdown
      setCountdown(timeLeft)

      const timerInterval = setInterval(() => {
        timeLeft -= 1
        if (timeLeft > 0) {
          setCountdown(timeLeft)
        } else {
          clearInterval(timerInterval)
          setCountdown(null)
          
          setFlash(true)
          setTimeout(() => setFlash(false), 200)

          captureFrame()

          setTimeout(() => {
            takeNextShot(currentShotIndex + 1)
          }, 1500)
        }
      }, 1000)
    },
    [shotsRequired]
  )

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw flipped image
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const dataUrl = canvas.toDataURL('image/png')
        setPhotos((prev) => [...prev, dataUrl])
      }
    }
  }

  const finishCaptureSequence = () => {
    setIsCapturing(false)
    setIsProcessing(true)

    // 1. Dừng quay video
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // 2. Chờ 1 chút để xử lý video và tạo GIF
    setTimeout(() => {
      setPhotos((currentPhotos) => {
        const videoBlob = recordedChunksRef.current.length > 0 
          ? new Blob(recordedChunksRef.current, { type: 'video/webm' }) 
          : undefined

        // Tạo GIF từ mảng ảnh (currentPhotos)
        gifshot.createGIF({
          images: currentPhotos,
          gifWidth: 400,
          gifHeight: Math.round(400 / slotRatio),
          interval: 0.5, // 0.5 giây / frame
          numFrames: shotsRequired,
        }, (obj) => {
          let gifBlob: Blob | undefined = undefined;
          if (!obj.error) {
            // Convert base64 gif to Blob
            const byteString = atob(obj.image.split(',')[1]);
            const mimeString = obj.image.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            gifBlob = new Blob([ab], { type: mimeString });
          } else {
            console.error('Tạo GIF lỗi:', obj.errorMsg);
          }

          // Hoàn thành: Trả về photos, video blob và gif blob
          setIsProcessing(false)
          onComplete(currentPhotos, videoBlob, gifBlob)
        })

        return currentPhotos
      })
    }, 500)
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-6">
        <button
          onClick={onBack}
          disabled={isCapturing || isProcessing}
          className="px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all disabled:opacity-50 border border-white/10"
        >
          ← Quay Lại
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">
            CHỤP ẢNH
          </h2>
          <p className="text-pink-400 font-medium mt-1">
            Gói: {selectedPackage.title} • {shotsRequired} Ảnh
          </p>
        </div>
        <div className="w-[110px]" />
      </div>

      {error ? (
        <div className="bg-red-500/20 text-red-300 p-8 rounded-3xl border border-red-500/30 text-center w-full max-w-2xl mt-10">
          <p className="text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold"
          >
            Tải Lại Trang
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center">
          {/* CAMERA PREVIEW */}
          <div 
            className="relative w-full max-w-3xl mx-auto rounded-[32px] overflow-hidden bg-black/50 border-4 border-slate-700 shadow-2xl flex-shrink-0 flex items-center justify-center"
            style={{ aspectRatio: slotRatio }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            
            {/* Recording Indicator */}
            {isCapturing && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-red-500/50 z-50">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 font-bold tracking-widest text-sm">REC</span>
              </div>
            )}
            
            {flash && (
              <div className="absolute inset-0 bg-white z-50 animate-flash" />
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-40">
                <span className="text-[150px] md:text-[250px] font-black text-white drop-shadow-[0_0_30px_rgba(233,69,96,1)] animate-bounce-short">
                  {countdown}
                </span>
              </div>
            )}
            
            {!isCapturing && !isProcessing && photos.length === 0 && stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
                <button
                  onClick={startSequence}
                  className="px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-2xl rounded-full shadow-[0_0_40px_rgba(233,69,96,0.8)] hover:scale-105 active:scale-95 transition-all"
                >
                  📸 BẮT ĐẦU CHỤP
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-2xl font-bold text-white animate-pulse">Đang tạo Video & GIF...</h3>
              </div>
            )}
          </div>

          {/* PROGRESS / THUMBNAILS */}
          <div className="w-full lg:w-64 flex flex-col gap-4">
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-white/10 text-center">
              <h3 className="text-white/60 font-bold text-sm uppercase mb-1">
                Tiến Độ
              </h3>
              <p className="text-3xl font-black text-white">
                <span className="text-pink-500">{photos.length}</span> / {shotsRequired}
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {Array.from({ length: shotsRequired }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-full aspect-video rounded-xl border-2 flex items-center justify-center overflow-hidden bg-black/20 ${
                    i < photos.length 
                      ? 'border-pink-500 shadow-[0_0_15px_rgba(233,69,96,0.3)]' 
                      : i === photos.length && isCapturing
                        ? 'border-white/50 border-dashed animate-pulse'
                        : 'border-white/10 border-dashed'
                  }`}
                >
                  {photos[i] ? (
                    <img src={photos[i]} alt={`Shot ${i+1}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/20 font-bold text-xl">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
