import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Spin } from "antd"
import type { Frame, LayoutSlot, FilterPreset, PhotoSticker, PhotoEffect } from "@/types/capture.types"
import baseFramesData from "@/data/base_frames.json"

interface PhotoComposerProps {
  photos: string[]
  frame: Frame
  precomposed?: boolean
  filterPreset?: FilterPreset | null
  effect?: PhotoEffect | null
  effectOpacity?: number
  bgColor?: string
  stickers?: PhotoSticker[]
  selectedStickerId?: string | null
  onSelectSticker?: (id: string | null) => void
  onStickerMove?: (id: string, x: number, y: number) => void
  onStickerResize?: (id: string, newSize: number) => void
  onStickerRotate?: (id: string, newRotation: number) => void
  onStickerDuplicate?: (id: string) => void
  onStickerDelete?: (id: string) => void
  onStickerContextMenu?: (id: string, x: number, y: number) => void
  onComplete: (processedCanvas: HTMLCanvasElement, originalCanvas: HTMLCanvasElement) => void
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: LayoutSlot,
) {
  const { x, y, width: w, height: h } = slot
  const imgW = img.naturalWidth || img.width
  const imgH = img.naturalHeight || img.height

  if (imgW === 0 || imgH === 0) {
    console.warn("[Composer] img size=0, skip")
    return
  }

  const imgRatio = imgW / imgH
  const slotRatio = w / h
  let sx = 0, sy = 0, sw = imgW, sh = imgH

  if (imgRatio > slotRatio) {
    sw = imgH * slotRatio
    sx = (imgW - sw) / 2
  } else {
    sh = imgW / slotRatio
    sy = (imgH - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Proxy R2 public URL để bypass CORS khi vẽ lên canvas
    const proxiedUrl = url.replace('https://pub-4eb303709ef24609a3b420990203812a.r2.dev', '/r2-proxy')

    const img = new Image()
    img.crossOrigin = "anonymous"
    const onLoad = () => { cleanup(); resolve(img) }
    const onError = () => { cleanup(); reject(new Error("Lỗi tải ảnh")) }
    const cleanup = () => { img.removeEventListener("load", onLoad); img.removeEventListener("error", onError) }
    
    img.addEventListener("load", onLoad)
    img.addEventListener("error", onError)
    img.src = proxiedUrl
    
    setTimeout(() => { cleanup(); reject(new Error("Timeout chờ ảnh")) }, 5000)
  })
}

export default function PhotoComposer({
  photos,
  frame,
  precomposed = false,
  filterPreset,
  effect,
  effectOpacity = 1,
  bgColor = '#ffffff',
  stickers = [],
  selectedStickerId,
  onSelectSticker,
  onStickerMove,
  onStickerResize,
  onStickerRotate,
  onStickerDuplicate,
  onStickerDelete,
  onStickerContextMenu,
  onComplete,
}: PhotoComposerProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [composing, setComposing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    async function compose() {
      try {
        // Fallback to base_frames.json if layout from DB is incomplete or for testing "1x4"
        const baseFramesList = Array.isArray(baseFramesData) ? baseFramesData : [baseFramesData]
        const baseFrame = baseFramesList.find(b => b.id === frame.aspect_ratio || b.id === '1x4')
        const layoutToUse = (frame.layout_config && frame.layout_config.slots?.length > 0)
          ? frame.layout_config
          : (baseFrame ? baseFrame.layout_config : null)

        if (!layoutToUse) {
          throw new Error(`Frame "${frame.name}" không có layout_config hợp lệ`)
        }

        const { canvas_width, canvas_height, slots } = layoutToUse

        console.log("[Composer] layout:", { canvas_width, canvas_height, slots_count: slots?.length })
        console.log("[Composer] photos:", photos.length)

        if (!slots || slots.length === 0) {
          throw new Error(`Frame "${frame.name}" không có slots`)
        }

        setDebugInfo(`${photos.length} ảnh - ${slots.length} slot - ${canvas_width}x${canvas_height}`)

        const readyPhotos = await Promise.all(photos.map(loadImageFromUrl))

        const originalCanvas = document.createElement("canvas")
        originalCanvas.width = canvas_width
        originalCanvas.height = canvas_height
        const originalCtx = originalCanvas.getContext("2d")!

        // Apply filter preset if present
        if (filterPreset && filterPreset.cssFilter !== 'none') {
          originalCtx.filter = filterPreset.cssFilter
        }

        slots.forEach((slot: LayoutSlot, i: number) => {
          const img = readyPhotos[precomposed ? 0 : i]
          if (!img || (precomposed && i > 0)) return
          if (precomposed) originalCtx.drawImage(img, 0, 0, canvas_width, canvas_height)
          else drawImageCover(originalCtx, img, slot)
        })

        // Reset filter for frame draw
        originalCtx.filter = 'none'

        // processedCanvas: FRAME + PHOTOS
        const processedCanvas = document.createElement("canvas")
        processedCanvas.width = canvas_width
        processedCanvas.height = canvas_height
        const processedCtx = processedCanvas.getContext("2d")!

        // 1. Draw solid background
        processedCtx.fillStyle = bgColor
        processedCtx.fillRect(0, 0, canvas_width, canvas_height)

        // 2. Draw photos into slots
        slots.forEach((slot: LayoutSlot, i: number) => {
          const img = readyPhotos[precomposed ? 0 : i]
          if (!img || (precomposed && i > 0)) return
          processedCtx.save()

          if (filterPreset && filterPreset.cssFilter !== 'none') {
            processedCtx.filter = filterPreset.cssFilter
          }

          if (precomposed) processedCtx.drawImage(img, 0, 0, canvas_width, canvas_height)
          else drawImageCover(processedCtx, img, slot)
          processedCtx.restore()
        })

        // 2.5 Draw selected effect overlay
        if (effect && effect.id !== 'none' && effect.url) {
          try {
            const effectImg = await loadImageFromUrl(effect.url)
            processedCtx.save()
            processedCtx.globalAlpha = effectOpacity
            processedCtx.globalCompositeOperation = (effect.blendMode as GlobalCompositeOperation) || 'source-over'
            processedCtx.drawImage(effectImg, 0, 0, canvas_width, canvas_height)
            processedCtx.restore()
          } catch (err) {
            console.warn('[Composer] Failed to load effect overlay', err)
          }
        }

        // 3. Draw Overlay Selected Frame (Đè frame PNG đục lỗ lên trên cùng)
        if (frame.image_url) {
          try {
            console.log("[Composer] Bắt đầu tải frame overlay từ URL:", frame.image_url)
            const frameOverlayImg = await loadImageFromUrl(frame.image_url)
            console.log("[Composer] Đã tải frame overlay thành công, kích thước:", frameOverlayImg.width, "x", frameOverlayImg.height)
            processedCtx.drawImage(frameOverlayImg, 0, 0, canvas_width, canvas_height)
            console.log("[Composer] Đã vẽ frame overlay lên canvas.")
          } catch (err) {
            console.error("[Composer] Lỗi tải ảnh frame overlay, sử dụng ảnh gốc:", err)
            throw new Error(`Không thể tải ảnh viền khung (frame). Lỗi: ${err instanceof Error ? err.message : String(err)}. Vui lòng kiểm tra lại đường truyền hoặc link ảnh: ${frame.image_url}`)
          }
        } else {
          console.warn("[Composer] frame.image_url bị trống, không có ảnh khung nào được tải!")
          throw new Error("Frame này chưa có ảnh viền (image_url trống), nên không thể ghép khung được.")
        }

        for (const sticker of stickers) {
          processedCtx.save()
          const x = sticker.x * canvas_width
          const y = sticker.y * canvas_height
          const size = sticker.size * canvas_width
          processedCtx.translate(x, y)
          processedCtx.rotate((sticker.rotation * Math.PI) / 180)
          processedCtx.font = `${size}px sans-serif`
          processedCtx.textAlign = 'center'
          processedCtx.textBaseline = 'middle'

          // Draw outline with outlineWidth if provided
          const outlineW = sticker.outlineWidth ?? 0
          if (outlineW > 0) {
            processedCtx.shadowColor = sticker.outlineColor
            processedCtx.shadowBlur = Math.max(2, outlineW * 2)
          } else {
            processedCtx.shadowColor = sticker.outlineColor
            processedCtx.shadowBlur = Math.max(2, size * 0.08)
          }

          if (sticker.src.startsWith('emoji:')) {
            processedCtx.fillText(sticker.src.slice(6), 0, 0)
          } else if (sticker.src.startsWith('data:')) {
            // Custom icon (already processed with outline in canvas)
            try {
              const stickerImage = new Image()
              stickerImage.src = sticker.src
              await new Promise<void>((resolve) => { stickerImage.onload = () => resolve(); stickerImage.onerror = () => resolve() })
              processedCtx.shadowBlur = 0
              processedCtx.drawImage(stickerImage, -size / 2, -size / 2, size, size)
            } catch (stickerError) {
              console.warn('[Composer] Không tải được sticker:', stickerError)
            }
          } else {
            try {
              const stickerImage = await loadImageFromUrl(sticker.src)
              processedCtx.drawImage(stickerImage, -size / 2, -size / 2, size, size)
            } catch (stickerError) {
              console.warn('[Composer] Không tải được sticker:', stickerError)
            }
          }
          processedCtx.restore()
        }

        if (previewRef.current) {
          previewRef.current.innerHTML = ""
          processedCanvas.style.width = "100%"
          processedCanvas.style.borderRadius = "16px"
          previewRef.current.appendChild(processedCanvas)
        }

        setComposing(false)
        onComplete(processedCanvas, originalCanvas)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ghép ảnh thất bại"
        console.error("[Composer] Error:", err)
        setError(msg)
        setComposing(false)
      }
    }

    compose()
  }, [bgColor, filterPreset, effect, effectOpacity, frame, photos, stickers])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-2 font-medium">⚠️ {error}</p>
        <p className="text-white/40 text-sm">Vui lòng thử lại từ đầu</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {composing && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Spin size="large" />
          <p className="text-pink-300 animate-pulse text-sm">Đang kết xuất ảnh hoàn chỉnh...</p>
          {debugInfo && <p className="text-white/30 text-xs font-mono">{debugInfo}</p>}
        </div>
      )}
      <div
        className={composing ? "opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-500 relative select-none"}
        onPointerDown={(e) => {
          // Clicking empty canvas area deselects
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
            onSelectSticker?.(null)
          }
        }}
      >
        <div ref={previewRef} />
        {!composing && stickers.map((sticker) => {
          const isSelected = selectedStickerId === sticker.id

          return (
            <div
              key={sticker.id}
              role="button"
              tabIndex={0}
              aria-label={`Sticker ${sticker.label}`}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-xl p-1 touch-none transition-shadow ${
                isSelected
                  ? 'ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-slate-900 bg-white/20 shadow-xl'
                  : 'border-2 border-dashed border-white/50 hover:border-fuchsia-400 bg-white/10 hover:bg-white/20'
              }`}
              style={{
                left: `${sticker.x * 100}%`,
                top: `${sticker.y * 100}%`,
                width: `${sticker.size * 100}%`,
                aspectRatio: '1',
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                // Don't drag if clicking buttons or handle inside
                if ((event.target as HTMLElement).closest('.sticker-control')) return

                onSelectSticker?.(sticker.id)
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
                const rect = event.currentTarget.parentElement?.getBoundingClientRect()
                if (!rect || !onStickerMove) return
                onStickerMove(
                  sticker.id,
                  Math.max(0.05, Math.min(0.95, (event.clientX - rect.left) / rect.width)),
                  Math.max(0.05, Math.min(0.95, (event.clientY - rect.top) / rect.height))
                )
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onSelectSticker?.(sticker.id)
                if (onStickerContextMenu) {
                  onStickerContextMenu(sticker.id, event.clientX, event.clientY)
                }
              }}
            >
              {/* Sticker Graphic */}
              <div className="w-full h-full flex items-center justify-center pointer-events-none">
                {sticker.src.startsWith('emoji:') ? (
                  <span className="text-3xl leading-none">{sticker.src.slice(6)}</span>
                ) : (
                  <img src={sticker.src} alt="" className="h-full w-full object-contain" />
                )}
              </div>

              {/* Controls when selected */}
              {isSelected && (
                <>
                  {/* Circular Rotation Stem & Knob at Top */}
                  <div
                    className="sticker-control absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      const stickerElem = event.currentTarget.parentElement
                      if (!stickerElem) return

                      const rect = stickerElem.getBoundingClientRect()
                      const cx = rect.left + rect.width / 2
                      const cy = rect.top + rect.height / 2

                      const onMove = (moveEvt: PointerEvent) => {
                        const rad = Math.atan2(moveEvt.clientY - cy, moveEvt.clientX - cx)
                        let deg = Math.round(rad * (180 / Math.PI) + 90)
                        deg = ((deg % 360) + 360) % 360
                        onStickerRotate?.(sticker.id, deg)
                      }

                      const onUp = () => {
                        window.removeEventListener('pointermove', onMove)
                        window.removeEventListener('pointerup', onUp)
                      }

                      window.addEventListener('pointermove', onMove)
                      window.addEventListener('pointerup', onUp)
                    }}
                  >
                    <div
                      title="Kéo chuột vòng tròn để xoay 360°"
                      className="w-5 h-5 rounded-full bg-white border-2 border-fuchsia-500 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 hover:bg-fuchsia-50 transition-transform text-[10px]"
                    >
                      🔄
                    </div>
                    <div className="w-0.5 h-2 bg-fuchsia-500" />
                  </div>

                  {/* Floating Action Toolbar above rotation handle */}
                  <div
                    className="sticker-control absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 text-white px-2.5 py-1 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap z-40"
                    style={{ transform: `translateX(-50%) rotate(-${sticker.rotation}deg)` }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Xoay 180° vòng tròn"
                      className="px-1.5 py-0.5 rounded hover:bg-fuchsia-600 text-xs font-bold transition-colors"
                      onClick={() => onStickerRotate?.(sticker.id, (sticker.rotation + 180) % 360)}
                    >
                      🔄 180°
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      title="Thu nhỏ"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-fuchsia-600 text-xs font-bold transition-colors"
                      onClick={() => onStickerResize?.(sticker.id, Math.max(0.06, sticker.size - 0.03))}
                    >
                      ➖
                    </button>
                    <button
                      type="button"
                      title="Phóng to"
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-fuchsia-600 text-xs font-bold transition-colors"
                      onClick={() => onStickerResize?.(sticker.id, Math.min(0.45, sticker.size + 0.03))}
                    >
                      ➕
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      title="Nhân đôi"
                      className="px-1.5 py-0.5 rounded hover:bg-blue-600 text-xs font-bold transition-colors"
                      onClick={() => onStickerDuplicate?.(sticker.id)}
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      title="Xóa"
                      className="px-1.5 py-0.5 rounded hover:bg-red-600 text-xs font-bold transition-colors"
                      onClick={() => onStickerDelete?.(sticker.id)}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Corner Resize Handle */}
                  <div
                    className="sticker-control absolute -bottom-2 -right-2 w-5 h-5 bg-fuchsia-500 hover:bg-fuchsia-400 rounded-full border-2 border-white shadow-lg cursor-nwse-resize flex items-center justify-center z-20"
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      const startX = event.clientX
                      const initialSize = sticker.size
                      const container = event.currentTarget.closest('.relative')?.getBoundingClientRect()
                      const containerW = container ? container.width : 300

                      const onMove = (moveEvt: PointerEvent) => {
                        const deltaX = (moveEvt.clientX - startX) / containerW * 1.5
                        const newSize = Math.max(0.06, Math.min(0.45, initialSize + deltaX))
                        onStickerResize?.(sticker.id, newSize)
                      }

                      const onUp = () => {
                        window.removeEventListener('pointermove', onMove)
                        window.removeEventListener('pointerup', onUp)
                      }

                      window.addEventListener('pointermove', onMove)
                      window.addEventListener('pointerup', onUp)
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
