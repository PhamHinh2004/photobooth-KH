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

import type { GifRecord, PackageOption, Frame, FilterPreset, PhotoRecord, RecordingRecord } from '@/types/capture.types'
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
  const [uploadedResults, setUploadedResults] = useState<{
    photo: PhotoRecord | null
    recording: RecordingRecord | null
    gif: GifRecord | null
  }>({ photo: null, recording: null, gif: null })

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
          const uploads = await Promise.all([
            savePhoto({
              accountId: String(user.id),
              frameId: selectedFrame?.id,
              processedBlob: processedPhotoBlob,
              originalBlob: originalPhotoBlob,
            }),
            recordingBlob
              ? saveRecording({
                  accountId: String(user.id),
                  videoBlob: recordingBlob,
                })
              : Promise.resolve(null),
            gifBlob
              ? saveGif({
                  accountId: String(user.id),
                  gifType: 'standard',
                  gifBlob: gifBlob,
                })
              : Promise.resolve(null),
          ])

          const photoRes = uploads[0]
          const recordingRes = uploads[1]
          const gifRes = uploads[2]

          setUploadedResults({
            photo: photoRes,
            recording: recordingRes,
            gif: gifRes,
          })

          const sessionPayload = {
            accountId: String(user.id),
            sessionType: 'single' as const,
            photoId: photoRes?.id,
            recordingId: recordingRes ? recordingRes.id : undefined,
            gifId: gifRes ? gifRes.id : undefined,
          }

          await createSessionResult(sessionPayload)
          setUploadSuccess(true)
        } catch (err: any) {
          console.error('Lỗi khi tải kết quả lên:', err)
          setUploadError(err.message || 'Lưu kết quả thất bại')
        } finally {
          setIsUploading(false)
        }
      }

      performUpload()
    }
  }, [step, customerId, user, processedPhotoBlob, originalPhotoBlob, recordingBlob, gifBlob, selectedFrame])

  const steps = stepsData
  const currentStepIdx = steps.findIndex(s => s.key === step)

  // Step labels matching Figma design
  const stepLabels = [
    { key: 'package-select', label: 'Chọn Frame',        icon: '▣' },
    { key: 'frame-select',   label: 'Chọn Style Frame',  icon: '✨' },
    { key: 'capturing',      label: 'Chụp Ảnh',          icon: '📷' },
    { key: 'review',         label: 'Review Ảnh',        icon: '🔄' },
    { key: 'filter',         label: 'Hậu Kỳ & Sticker',  icon: '🎨' },
    { key: 'result',         label: 'Nhận Kết Quả',      icon: '🎁' },
  ]

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: '#f8f9fa',
        backgroundImage: `
          radial-gradient(1200px circle at 0% 0%, rgba(255, 0, 255, 0.05) 0%, transparent 60%),
          radial-gradient(1200px circle at 100% 0%, rgba(137, 207, 240, 0.18) 0%, transparent 60%),
          radial-gradient(1000px circle at 50% 100%, rgba(229, 228, 226, 0.5) 0%, transparent 60%)
        `
      }}
    >
      {/* ══════════════════════════════════════
          TOP NAVBAR (Figma Hình 1)
      ══════════════════════════════════════ */}
      <nav className="w-full bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo KH BOOTH AI */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
              KH BOOTH
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-600 border border-sky-200">
              AI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium text-gray-600">
            <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-0">Trang Chủ</button>
            <button onClick={() => setStep('package-select')} className="text-gray-900 font-semibold cursor-pointer bg-transparent border-0">Chụp Đơn</button>
            <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-0">Chụp Nhóm</button>
            <button onClick={() => navigate('/about-us')} className="hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-0">Về Chúng Tôi</button>
            <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-0">Chính Sách</button>
          </div>

          {/* CTA & Avatar */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setStep('package-select')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#89CFF0] to-[#38bdf8] text-gray-900 font-bold text-xs shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer border-0"
            >
              <span>BẮT ĐẦU CHỤP</span>
              <span>✨</span>
            </button>
            <div 
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-sky-800 text-white flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-90"
              title={user?.name || 'Tài khoản'}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          STEP PROGRESS BAR (Figma Hình 1)
      ══════════════════════════════════════ */}
      <div className="w-full px-4 pt-4 pb-2">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 border border-[#E5E4E2] shadow-sm flex items-center justify-between overflow-x-auto">
          {stepLabels.map((item, idx) => {
            const isPast    = idx < currentStepIdx
            const isCurrent = idx === currentStepIdx

            return (
              <div key={item.key} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => {
                    if (isPast) {
                      const keys = ['package-select', 'frame-select', 'capturing', 'review', 'filter', 'result']
                      setStep(keys[idx] as any)
                    }
                  }}
                  disabled={!isPast && !isCurrent}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-all duration-200 whitespace-nowrap rounded-full ${
                    isCurrent
                      ? 'bg-[#2d3139] text-white shadow-sm'
                      : isPast
                        ? 'bg-[#489ba5] text-white hover:opacity-90 cursor-pointer shadow-xs'
                        : 'text-gray-400 cursor-default'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <span>{idx === 0 ? '▣' : '✨'}</span>
                      <span>{item.label}</span>
                    </>
                  ) : isPast ? (
                    <>
                      <span className="text-[10px] font-black">✓</span>
                      <span>{item.label}</span>
                    </>
                  ) : (
                    <>
                      <span>{idx + 1}</span>
                      <span>{item.label}</span>
                    </>
                  )}
                </button>

                {/* Pipe separator */}
                {idx < stepLabels.length - 1 && (
                  <span className="text-gray-300 text-xs mx-2 select-none">|</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════ */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {customerLoading && (
          <div className="flex justify-center py-16">
            <Spin tip="Đang tải studio..." size="large" />
          </div>
        )}

        {customerError && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
            <p className="text-red-600 mb-4">{customerError}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg hover:bg-red-600 transition-all cursor-pointer"
            >
              Đăng nhập lại
            </button>
          </div>
        )}

        {!customerLoading && !customerError && (
          <div className="min-h-[500px]">
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
                onPhotosChange={setCapturedPhotos}
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
              <div className="w-full max-w-2xl mx-auto text-center p-10 bg-white/90 backdrop-blur-sm rounded-3xl border border-[#E5E4E2] flex flex-col items-center justify-center mt-4 shadow-sm">
                {isUploading ? (
                  <>
                    <div className="w-20 h-20 border-4 border-[#FF00FF] border-t-transparent rounded-full animate-spin mb-6" />
                    <h2 className="text-3xl font-black mb-2 animate-pulse text-gray-900">ĐANG TẢI LÊN...</h2>
                    <p className="text-gray-500">Vui lòng đợi trong giây lát, hệ thống đang lưu ảnh, video và GIF của bạn.</p>
                  </>
                ) : uploadError ? (
                  <>
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-black mb-2 text-red-500">LỖI TẢI LÊN</h2>
                    <p className="text-gray-500 mb-8">{uploadError}</p>
                    <button
                      onClick={() => setStep('filter')}
                      className="px-8 py-3 rounded-full bg-red-50 text-red-500 border border-red-200 font-bold hover:bg-red-100 transition-all cursor-pointer"
                    >
                      Quay Lại &amp; Thử Lại
                    </button>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-black mb-4 text-gray-900">KẾT QUẢ ĐÃ SẴN SÀNG!</h2>
                    <p className="text-gray-500 mb-6">Ảnh, GIF và video hậu trường đã được lưu thành công.</p>
                    <div className="grid w-full gap-3 text-left sm:grid-cols-3">
                      {uploadedResults.photo?.processed_file_url && (
                        <a href={uploadedResults.photo.processed_file_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-fuchsia-400">
                          <img src={uploadedResults.photo.processed_file_url} alt="Ảnh cuối cùng" className="mb-2 aspect-square w-full rounded-xl object-contain" />
                          <span className="text-xs font-bold text-slate-700">Ảnh cuối cùng</span>
                        </a>
                      )}
                      {uploadedResults.gif && (
                        <a href={uploadedResults.gif.image_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-fuchsia-400">
                          <img src={uploadedResults.gif.image_url} alt="GIF hậu kỳ" className="mb-2 aspect-square w-full rounded-xl object-contain" />
                          <span className="text-xs font-bold text-slate-700">GIF</span>
                        </a>
                      )}
                      {uploadedResults.recording?.file_url && (
                        <a href={uploadedResults.recording.file_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-fuchsia-400">
                          <video src={uploadedResults.recording.file_url} controls className="mb-2 aspect-square w-full rounded-xl object-contain" />
                          <span className="text-xs font-bold text-slate-700">Video hậu trường</span>
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setStep('package-select')
                        setCapturedPhotos([])
                        setSelectedPackage(null)
                        setSelectedFrame(null)
                        setRecordingBlob(null)
                        setGifBlob(null)
                        setUploadedResults({ photo: null, recording: null, gif: null })
                      }}
                      className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-[#FF00FF] to-[#89CFF0] text-white font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
                    >
                      Chụp Lượt Mới
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════
          FOOTER (Figma Hình 1)
      ══════════════════════════════════════ */}
      <footer className="w-full border-t border-gray-200/60 py-6 px-6 bg-white/40 backdrop-blur-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-[#d946ef]">KH BOOTH</span>
            <span>© 2026 Photobooth AI Y2K. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/about-us')} className="hover:text-gray-800 transition-colors cursor-pointer bg-transparent border-0">Về Chúng Tôi</button>
            <button onClick={() => navigate('/')} className="hover:text-gray-800 transition-colors cursor-pointer bg-transparent border-0">Điều Khoản</button>
            <button onClick={() => navigate('/')} className="hover:text-gray-800 transition-colors cursor-pointer bg-transparent border-0">Bảo Mật</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
