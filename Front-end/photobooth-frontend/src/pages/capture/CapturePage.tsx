import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import { 
  getCustomerByAccountId, 
  savePhoto, 
  saveRecording, 
  saveGif, 
  createSessionResult 
} from '@/api/capture.api'

import PackageSelector from '@/components/capture/step1/PackageSelector'
import FrameSelector from '@/components/capture/step2/FrameSelector'
import CameraCapture from '@/components/capture/step3/CameraCapture'
import ReviewScreen from '@/components/capture/step4/ReviewScreen'
import FilterScreen from '@/components/capture/step5/FilterScreen'

import type { PackageOption, Frame, FilterPreset } from '@/types/capture.types'
import stepsData from '@/data/steps.json'

export default function CapturePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [step, setStep] = useState<'package-select' | 'frame-select' | 'capturing' | 'review' | 'filter' | 'result'>('package-select')
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  
  // Media Blobs
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [gifBlob, setGifBlob] = useState<Blob | null>(null)
  const [processedPhotoBlob, setProcessedPhotoBlob] = useState<Blob | null>(null)
  const [originalPhotoBlob, setOriginalPhotoBlob] = useState<Blob | null>(null)

  // Upload States
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Customer ID
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
      return
    }

    setCustomerLoading(true)
    getCustomerByAccountId(String(user.id))
      .then((profile) => {
        setCustomerId(profile.id)
      })
      .catch(() => {
        setCustomerError('Không lấy được thông tin khách hàng. Vui lòng đăng nhập lại.')
      })
      .finally(() => setCustomerLoading(false))
  }, [isAuthenticated, user, navigate])

  function handleSelectPackage(pkg: PackageOption) {
    setSelectedPackage(pkg)
    setStep('frame-select')
  }

  function handleSelectFrame(frame: Frame) {
    setSelectedFrame(frame)
    setStep('capturing')
  }

  function handleCaptureComplete(photos: string[], videoBlob?: Blob, gifDataBlob?: Blob) {
    setCapturedPhotos(photos)
    if (videoBlob) setRecordingBlob(videoBlob)
    if (gifDataBlob) setGifBlob(gifDataBlob)
    setStep('review')
  }

  function handleReviewComplete() {
    setStep('filter')
  }

  function handleFilterComplete(processedCanvas: HTMLCanvasElement, originalCanvas: HTMLCanvasElement, _filter: FilterPreset, _bgColor: string) {
    // Generate blobs and proceed to result step
    processedCanvas.toBlob((pBlob) => {
      if (pBlob) setProcessedPhotoBlob(pBlob)
      originalCanvas.toBlob((oBlob) => {
        if (oBlob) setOriginalPhotoBlob(oBlob)
        setStep('result')
      }, 'image/png')
    }, 'image/png')
  }

  // Handle Parallel Uploads in Result Step
  useEffect(() => {
    if (step === 'result' && customerId && user && processedPhotoBlob && originalPhotoBlob) {
      const performUpload = async () => {
        setIsUploading(true)
        setUploadError(null)

        try {
          const accountId = String(user.id)
          
          // Tạo các promises để upload song song
          const uploadPromises: Promise<any>[] = []

          // 1. Upload Photo
          const photoPromise = savePhoto({
            accountId: accountId,
            frameId: selectedFrame?.id,
            processedBlob: processedPhotoBlob,
            originalBlob: originalPhotoBlob,
          })
          uploadPromises.push(photoPromise)

          // 2. Upload Recording (Nếu có)
          let recordingPromise: Promise<any> | null = null
          if (recordingBlob) {
            recordingPromise = saveRecording({
              accountId,
              videoBlob: recordingBlob
            })
            uploadPromises.push(recordingPromise)
          }

          // 3. Upload GIF (Nếu có)
          let gifPromise: Promise<any> | null = null
          if (gifBlob) {
            gifPromise = saveGif({
              accountId,
              gifType: 'standard',
              gifBlob: gifBlob
            })
            uploadPromises.push(gifPromise)
          }

          // Đợi tất cả upload xong
          const results = await Promise.all(uploadPromises)

          // Phân tích kết quả
          const photoRecord = results[0]
          const recordingRecord = recordingPromise ? results[uploadPromises.indexOf(recordingPromise)] : null
          const gifRecord = gifPromise ? results[uploadPromises.indexOf(gifPromise)] : null

          // 4. Tạo Session Result
          await createSessionResult({
            accountId,
            sessionType: 'single',
            photoId: photoRecord?.id,
            recordingId: recordingRecord?.id,
            gifId: gifRecord?.id
          })

          setUploadSuccess(true)
        } catch (err: any) {
          console.error('Upload Error:', err)
          setUploadError(err.message || 'Có lỗi xảy ra khi lưu trữ dữ liệu.')
        } finally {
          setIsUploading(false)
        }
      }

      performUpload()
    }
  }, [step, processedPhotoBlob, originalPhotoBlob, customerId, user])

  const steps = stepsData
  const currentStepIdx = steps.findIndex(s => s.key === step)

  return (
    <div
      className="min-h-screen text-slate-100 font-sans pb-16"
      style={{
        background: 'linear-gradient(135deg, #090a0f 0%, #150d2a 40%, #0f172a 70%, #080c19 100%)',
      }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #e94560, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(233,69,96,0.6)]">
              📸
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                KH <span className="text-pink-500">PHOTOBOOTH</span>
              </h1>
              <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Studio Kỷ Niệm 4.0</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold border border-white/10 transition-all"
          >
            Về Trang Chủ
          </button>
        </div>

        <div className="w-full max-w-4xl mx-auto mb-8 overflow-x-auto overflow-y-hidden pb-8 pt-2 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          <div className="flex items-center justify-between min-w-[650px] px-2">
            {steps.map((item, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              
              return (
                <div key={item.key} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center group cursor-default relative">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${
                        isPast
                          ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(233,69,96,0.5)] cursor-pointer'
                          : isCurrent
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-[0_0_25px_rgba(233,69,96,0.8)] scale-110 ring-4 ring-pink-500/20'
                            : 'bg-white/5 text-white/30 border border-white/10'
                      }`}
                      onClick={() => {
                        if (isPast && idx === 0) setStep('package-select')
                      }}
                    >
                      {isPast ? '✓' : item.icon}
                    </div>
                    <span
                      className={`absolute top-12 text-[10px] font-bold whitespace-nowrap transition-colors ${
                        isCurrent ? 'text-pink-400' : isPast ? 'text-white/70' : 'text-white/20'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 z-0 ${
                        idx < currentStepIdx ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_10px_rgba(233,69,96,0.5)]' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {customerLoading && (
          <div className="flex justify-center py-16">
            <Spin tip="Đang tải studio..." />
          </div>
        )}

        {customerError && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
            <p className="text-red-300 mb-4">{customerError}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm shadow-lg hover:bg-pink-600 transition-all"
            >
              Đăng nhập lại
            </button>
          </div>
        )}

        {!customerLoading && !customerError && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-4 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[500px]">
            {step === 'package-select' && (
              <PackageSelector onSelectPackage={handleSelectPackage} />
            )}
            
            {step === 'frame-select' && (
              <FrameSelector 
                selectedPackage={selectedPackage}
                onSelect={handleSelectFrame}
                onBack={() => setStep('package-select')}
              />
            )}

            {step === 'capturing' && selectedPackage && selectedFrame && (
              <CameraCapture
                selectedPackage={selectedPackage}
                selectedFrame={selectedFrame}
                onComplete={handleCaptureComplete}
                onBack={() => setStep('frame-select')}
              />
            )}

            {step === 'review' && (
              <ReviewScreen
                photos={capturedPhotos}
                onRetake={() => setStep('capturing')}
                onNext={handleReviewComplete}
              />
            )}

            {step === 'filter' && selectedFrame && (
              <FilterScreen
                photos={capturedPhotos}
                frame={selectedFrame}
                onBack={() => setStep('review')}
                onNext={handleFilterComplete}
              />
            )}

            {step === 'result' && (
              <div className="w-full max-w-2xl mx-auto text-center text-white p-10 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
                {isUploading ? (
                  <>
                    <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-6" />
                    <h2 className="text-3xl font-black mb-2 animate-pulse">ĐANG TẢI LÊN...</h2>
                    <p className="text-white/60">Vui lòng đợi trong giây lát, hệ thống đang lưu ảnh, video và GIF của bạn.</p>
                  </>
                ) : uploadError ? (
                  <>
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-black mb-2 text-red-400">LỖI TẢI LÊN</h2>
                    <p className="text-white/60 mb-8">{uploadError}</p>
                    <button
                      onClick={() => setStep('filter')} // Cho phép thử lại bằng cách quay lại bước filter
                      className="px-8 py-3 rounded-full bg-red-500/20 text-red-300 border border-red-500/50 font-bold hover:bg-red-500/40 transition-all"
                    >
                      Quay Lại & Thử Lại
                    </button>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-black mb-4">KẾT QUẢ ĐÃ SẴN SÀNG!</h2>
                    <p className="text-white/70">Ảnh, Video và GIF của bạn đã được lưu an toàn. Vui lòng lấy ảnh ở máy in hoặc quét mã QR.</p>
                    <button
                      onClick={() => {
                        setStep('package-select')
                        setCapturedPhotos([])
                        setSelectedPackage(null)
                        setSelectedFrame(null)
                        setRecordingBlob(null)
                        setGifBlob(null)
                      }}
                      className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-[0_0_20px_rgba(233,69,96,0.6)] hover:scale-105 transition-all"
                    >
                      Chụp Lượt Mới
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
