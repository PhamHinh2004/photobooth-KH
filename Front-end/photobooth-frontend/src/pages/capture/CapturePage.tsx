import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Spin, Modal, Input, Rate } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import {
  getCustomerByAccountId,
  savePhoto,
  saveRecording,
  saveGif,
  createSessionResult
} from '@/api/capture.api'
import { socialApi } from '@/api/social.api'
import { authApi } from '@/api/auth.api'
import { sharePostToFacebook } from '@/utils/facebookShare'

import PackageSelector, { PACKAGE_OPTIONS } from '@/components/capture/step1/PackageSelector'
import FrameSelector from '@/components/capture/step2/FrameSelector'
import CameraCapture from '@/components/capture/step3/CameraCapture'
import ReviewScreen from '@/components/capture/step4/ReviewScreen'
import FilterScreen from '@/components/capture/step5/FilterScreen'

import type { GifRecord, PackageOption, Frame, FilterPreset, PhotoRecord, RecordingRecord } from '@/types/capture.types'
import stepsData from '@/data/steps.json'

export default function CapturePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()

  const initialFrameId = location.state?.initialFrameId as string | undefined
  const initialFrame = location.state?.initialFrame as Frame | undefined

  const [step, setStep] = useState<'package-select' | 'frame-select' | 'capturing' | 'review' | 'filter' | 'result'>(
    initialFrameId ? 'frame-select' : initialFrame ? 'capturing' : 'package-select'
  )
  
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(() => {
    if (initialFrame) {
      if (initialFrame.aspect_ratio) {
        const exactMatch = PACKAGE_OPTIONS.find(p => p.id === initialFrame.aspect_ratio);
        if (exactMatch) return exactMatch;
      }
      const slotsCount = initialFrame.layout_config?.slots?.length || 4;
      const found = PACKAGE_OPTIONS.find(p => p.slotsCount === slotsCount);
      return found || PACKAGE_OPTIONS[0];
    }
    return null;
  })
  
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(initialFrame || null)

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

  // Share States
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [captionText, setCaptionText] = useState('Vừa chụp bộ ảnh thật cool tại KH BOOTH AI! 😎✨')
  const [frameRating, setFrameRating] = useState<number>(5)

  // Cancel confirmation modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [pendingBackStep, setPendingBackStep] = useState<string | null>(null)

  // Track whether history entries have been pushed (to avoid duplicates)
  const historyPushedRef = useRef(false)

  // Steps ordered list for navigation
  const STEP_KEYS = ['package-select', 'frame-select', 'capturing', 'review', 'filter', 'result'] as const

  // Navigate back one step with confirmation for step 3+
  const handleStepBack = useCallback((fromStep: string) => {
    const fromIdx = STEP_KEYS.indexOf(fromStep as any)
    if (fromIdx <= 0) return // already at step 1, nothing to go back to

    const targetStep = STEP_KEYS[fromIdx - 1]

    // If going back from step 3 (capturing) or later, show confirmation
    if (fromIdx >= 2) {
      setPendingBackStep(targetStep)
      setIsCancelModalOpen(true)
      return
    }

    // Steps 1-2: go back freely
    setStep(targetStep as any)
  }, [])

  // Confirm cancel and go back
  const confirmCancelAndGoBack = useCallback(() => {
    setIsCancelModalOpen(false)
    if (pendingBackStep) {
      setStep(pendingBackStep as any)
      setPendingBackStep(null)
    }
  }, [pendingBackStep])

  // Browser back button handling: push a history entry per step change
  useEffect(() => {
    // Push an entry so the browser back button triggers popstate instead of leaving the page
    if (!historyPushedRef.current) {
      window.history.pushState({ captureStep: step }, '')
      historyPushedRef.current = true
    }

    const handlePopState = () => {
      // Prevent the browser from actually navigating away
      // Push state back immediately so we stay on the page
      window.history.pushState({ captureStep: step }, '')
      handleStepBack(step)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [step, handleStepBack])

  // Push a new history entry whenever the step advances forward
  useEffect(() => {
    window.history.pushState({ captureStep: step }, '')
  }, [step])

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

  useEffect(() => {
    if (!initialFrame) return

    const matchingPackage = PACKAGE_OPTIONS.find((option) => option.id === initialFrame.aspect_ratio)
      || PACKAGE_OPTIONS.find((option) => option.slotsCount === (initialFrame.layout_config?.slots?.length || 4))

    setSelectedFrame(initialFrame)
    setSelectedPackage(matchingPackage || PACKAGE_OPTIONS[0])
    setStep('frame-select')
  }, [initialFrame, initialFrameId])

  function handleSelectPackage(pkg: PackageOption) {
    setSelectedPackage(pkg)
    setStep('frame-select')
  }

  function handleSelectFrame(frame: Frame) {
    if (!selectedPackage) {
      if (frame.aspect_ratio) {
        const exactMatch = PACKAGE_OPTIONS.find(p => p.id === frame.aspect_ratio);
        if (exactMatch) {
          setSelectedPackage(exactMatch);
        } else {
          const slotsCount = frame.layout_config?.slots?.length || 4;
          const found = PACKAGE_OPTIONS.find(p => p.slotsCount === slotsCount);
          setSelectedPackage(found || PACKAGE_OPTIONS[0]);
        }
      } else {
        const slotsCount = frame.layout_config?.slots?.length || 4;
        const found = PACKAGE_OPTIONS.find(p => p.slotsCount === slotsCount);
        setSelectedPackage(found || PACKAGE_OPTIONS[0]);
      }
    }
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

          const sessionResult = await createSessionResult(sessionPayload)
          setCreatedSessionId(sessionResult.id)

          // Đồng bộ vào lịch sử chụp (photo_sessions) để hiện trong Profile
          if (photoRes?.processed_file_url) {
            try {
              await authApi.saveMyPhoto({
                sessionType: 'solo',
                imageUrl: photoRes.processed_file_url,
                title: selectedFrame?.name || undefined,
              })
            } catch (syncErr) {
              // Lỗi đồng bộ không ảnh hưởng flow chính
              console.warn('Không thể đồng bộ vào lịch sử chụp:', syncErr)
            }
          }

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
    { key: 'package-select', label: 'Chọn Frame', icon: '▣' },
    { key: 'frame-select', label: 'Chọn Style Frame', icon: '✨' },
    { key: 'capturing', label: 'Chụp Ảnh', icon: '📷' },
    { key: 'review', label: 'Review Ảnh', icon: '🔄' },
    { key: 'filter', label: 'Hậu Kỳ & Sticker', icon: '🎨' },
    { key: 'result', label: 'Nhận Kết Quả', icon: '🎁' },
  ]

  const handleShareToFeed = async () => {
    if (!createdSessionId || !uploadedResults.photo?.processed_file_url) return
    setIsSharing(true)
    setShareError(null)
    try {
      const createdPost = await socialApi.createPost({
        session_id: createdSessionId,
        cover_image_url: uploadedResults.photo.processed_file_url,
        caption: captionText,
        style_tags: ['#khbooth', '#photobooth', '#ai'],
        rating: frameRating,
      })
      setIsShareModalOpen(false)
      if (createdPost?.id) {
        await sharePostToFacebook(createdPost.id)
      }
      navigate(`/reviews`)
    } catch (err: any) {
      console.error('Lỗi khi chia sẻ lên feed:', err)
      setShareError('Không thể chia sẻ bài viết, vui lòng thử lại sau.')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col pt-24 md:pt-28 pb-12"
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
          STEP PROGRESS BAR (Figma Hình 1)
      ══════════════════════════════════════ */}
      <div className="w-full px-4 pt-4 pb-2">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 border border-[#E5E4E2] shadow-sm flex items-center justify-between overflow-x-auto">
          {stepLabels.map((item, idx) => {
            const isPast = idx < currentStepIdx
            const isCurrent = idx === currentStepIdx

            return (
              <div key={item.key} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => {
                    if (isPast) {
                      // If going back to before step 3 from step 3+, show confirmation
                      if (currentStepIdx >= 2 && idx < currentStepIdx) {
                        setPendingBackStep(STEP_KEYS[idx])
                        setIsCancelModalOpen(true)
                      } else {
                        setStep(STEP_KEYS[idx] as any)
                      }
                    }
                  }}
                  disabled={!isPast && !isCurrent}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-all duration-200 whitespace-nowrap rounded-full ${isCurrent
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
                initialFrameId={initialFrameId}
                onSelect={handleSelectFrame}
                onBack={() => handleStepBack('frame-select')}
              />
            )}

            {step === 'capturing' && selectedPackage && selectedFrame && (
              <CameraCapture
                selectedPackage={selectedPackage}
                selectedFrame={selectedFrame}
                onComplete={handleCaptureComplete}
                onBack={() => handleStepBack('capturing')}
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
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
                      <button
                        onClick={() => {
                          setStep('package-select')
                          setCapturedPhotos([])
                          setSelectedPackage(null)
                          setSelectedFrame(null)
                          setRecordingBlob(null)
                          setGifBlob(null)
                          setUploadedResults({ photo: null, recording: null, gif: null })
                          setCreatedSessionId(null)
                          setShareError(null)
                        }}
                        className="px-8 py-3 rounded-full border-2 border-[#FF00FF] text-[#FF00FF] font-bold hover:bg-[#FF00FF] hover:text-white transition-all cursor-pointer"
                      >
                        Chụp Lượt Mới
                      </button>
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        disabled={isSharing || !createdSessionId}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-[#FF00FF] to-[#89CFF0] text-white font-bold shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        🌟 Chia Sẻ Lên Feed
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        title="Chia Sẻ Lên Feed"
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={handleShareToFeed}
        confirmLoading={isSharing}
        okText="Gửi"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-[#FF00FF] hover:bg-[#D500D5] border-none" }}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Đánh giá Frame:</span>
            <Rate value={frameRating} onChange={setFrameRating} className="text-[#FF00FF]" />
          </div>
          <Input.TextArea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            placeholder="Viết cảm nghĩ của bạn về bức ảnh này..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
        {shareError && <p className="text-red-500 mt-2 text-sm">{shareError}</p>}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title={null}
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false)
          setPendingBackStep(null)
        }}
        footer={null}
        centered
        width={420}
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Hủy lần chụp này?</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Nếu quay lại, toàn bộ ảnh đã chụp và dữ liệu của lần chụp hiện tại sẽ bị mất. Bạn có chắc chắn muốn hủy không?
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsCancelModalOpen(false)
                setPendingBackStep(null)
              }}
              className="flex-1 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer bg-transparent"
            >
              Tiếp Tục Chụp
            </button>
            <button
              onClick={confirmCancelAndGoBack}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer border-0"
            >
              Hủy &amp; Quay Lại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
