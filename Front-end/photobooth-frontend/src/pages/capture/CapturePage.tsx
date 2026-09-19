import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import { getCustomerByAccountId } from '@/api/capture.api'

import PackageSelector from '@/components/capture/PackageSelector'
import FrameSelector from '@/components/capture/FrameSelector'
import CameraCapture from '@/components/capture/CameraCapture'
import PhotoReviewSlot from '@/components/capture/PhotoReviewSlot'
import PhotoFilterAdjust from '@/components/capture/PhotoFilterAdjust'
import PhotoComposer from '@/components/capture/PhotoComposer'
import ResultScreen from '@/components/capture/ResultScreen'

import type {
  Frame,
  CaptureStep,
  PackageOption,
  FilterPreset,
} from '@/types/capture.types'

export default function CapturePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  // State machine (6 steps)
  const [step, setStep] = useState<CaptureStep>('package-select')

  // Selection Data
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<HTMLImageElement[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterPreset | null>(null)
  const [isComposing, setIsComposing] = useState<boolean>(false)

  // Canvas result outputs
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [originalCanvas, setOriginalCanvas] = useState<HTMLCanvasElement | null>(null)

  // Customer ID
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)

  // Load customerId from logged-in account
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

  // --- Handlers for Step transitions ---
  function handleSelectPackage(pkg: PackageOption) {
    setSelectedPackage(pkg)
    setStep('frame-select')
  }

  function handleFrameSelect(frame: Frame) {
    setSelectedFrame(frame)
    setStep('capturing')
  }

  function handleCaptureComplete(photos: HTMLImageElement[]) {
    setCapturedPhotos(photos)
    setStep('review')
  }

  function handleReviewConfirm(orderedPhotos: HTMLImageElement[]) {
    setCapturedPhotos(orderedPhotos)
    setStep('filter')
  }

  function handleApplyFilter(filter: FilterPreset) {
    setActiveFilter(filter)
    setIsComposing(true)
  }

  function handleComposeComplete(processed: HTMLCanvasElement, original: HTMLCanvasElement) {
    setProcessedCanvas(processed)
    setOriginalCanvas(original)
    setIsComposing(false)
    setStep('result')
  }

  function handleReset() {
    setStep('package-select')
    setSelectedPackage(null)
    setSelectedFrame(null)
    setCapturedPhotos([])
    setActiveFilter(null)
    setProcessedCanvas(null)
    setOriginalCanvas(null)
    setIsComposing(false)
  }

  // Stepper labels & icons
  const stepConfig: { key: CaptureStep; label: string; icon: string }[] = [
    { key: 'package-select', label: 'Gói Chụp', icon: '📦' },
    { key: 'frame-select', label: 'Style & Khung', icon: '🎨' },
    { key: 'capturing', label: 'Chụp Ảnh', icon: '📸' },
    { key: 'review', label: 'Review', icon: '🔄' },
    { key: 'filter', label: 'Hậu Kỳ', icon: '✨' },
    { key: 'result', label: 'Nhận Ảnh', icon: '🎁' },
  ]

  const currentStepIdx = stepConfig.findIndex((s) => s.key === step)

  const shotsCount = selectedPackage?.shotsCount || 4

  return (
    <div
      className="min-h-screen text-slate-100 font-sans pb-16"
      style={{
        background: 'linear-gradient(135deg, #090a0f 0%, #150d2a 40%, #0f172a 70%, #080c19 100%)',
      }}
    >
      {/* Background Glow Blobs */}
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
        {/* Top Navbar Brand */}
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

        {/* 6-Step Stepper Header */}
        <div className="w-full max-w-4xl mx-auto mb-10 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[600px] px-4">
            {stepConfig.map((item, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={item.key} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center group cursor-default">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isPast
                          ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(233,69,96,0.5)]'
                          : isCurrent
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-[0_0_25px_rgba(233,69,96,0.8)] scale-110 ring-4 ring-pink-500/20'
                            : 'bg-white/10 text-white/30 border border-white/5'
                      }`}
                    >
                      {isPast ? '✓' : item.icon}
                    </div>
                    <span
                      className={`text-xs mt-2 font-semibold whitespace-nowrap transition-colors ${
                        isCurrent ? 'text-pink-400 font-extrabold' : isPast ? 'text-white/80' : 'text-white/30'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {idx < stepConfig.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-3 rounded-full transition-all duration-500 mb-5 ${
                        idx < currentStepIdx ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Customer Profile loading */}
        {customerLoading && (
          <div className="flex justify-center py-16">
            <Spin tip="Đang khởi tạo studio chụp ảnh..." />
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

        {/* Main Step Container */}
        {!customerLoading && !customerError && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* STEP 1: Chọn gói */}
            {step === 'package-select' && (
              <PackageSelector onSelectPackage={handleSelectPackage} />
            )}

            {/* STEP 2: Chọn khung */}
            {step === 'frame-select' && (
              <FrameSelector
                selectedPackage={selectedPackage}
                onSelect={handleFrameSelect}
                onBack={() => setStep('package-select')}
              />
            )}

            {/* STEP 3: Chụp ảnh */}
            {step === 'capturing' && selectedFrame && (
              <CameraCapture
                totalShots={shotsCount}
                onComplete={handleCaptureComplete}
                onBack={() => setStep('frame-select')}
              />
            )}

            {/* STEP 4: Review & Xếp slot */}
            {step === 'review' && (
              <PhotoReviewSlot
                photos={capturedPhotos}
                onConfirm={handleReviewConfirm}
                onRetake={() => setStep('capturing')}
              />
            )}

            {/* STEP 5: Hậu kỳ & Bộ lọc */}
            {step === 'filter' && (
              <div>
                {!isComposing ? (
                  <PhotoFilterAdjust
                    photos={capturedPhotos}
                    onApplyFilter={handleApplyFilter}
                    onBack={() => setStep('review')}
                  />
                ) : (
                  selectedFrame && (
                    <PhotoComposer
                      photos={capturedPhotos}
                      frame={selectedFrame}
                      filterPreset={activeFilter}
                      onComplete={handleComposeComplete}
                    />
                  )
                )}
              </div>
            )}

            {/* STEP 6: Nhận ảnh & Kết quả */}
            {step === 'result' && processedCanvas && originalCanvas && selectedFrame && customerId && (
              <ResultScreen
                processedCanvas={processedCanvas}
                originalCanvas={originalCanvas}
                frame={selectedFrame}
                customerId={customerId}
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
