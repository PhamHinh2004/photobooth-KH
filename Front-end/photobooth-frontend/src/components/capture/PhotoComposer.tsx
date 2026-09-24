import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Spin } from "antd"
import type { Frame, LayoutSlot, FilterPreset, PhotoSticker } from "@/types/capture.types"
import baseFramesData from "@/data/base_frames.json"

interface PhotoComposerProps {
  photos: string[]
  frame: Frame
  filterPreset?: FilterPreset | null
  bgColor?: string
  stickers?: PhotoSticker[]
  onStickerMove?: (id: string, x: number, y: number) => void
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

export default function PhotoComposer({ photos, frame, filterPreset, bgColor = '#ffffff', stickers = [], onStickerMove, onComplete }: PhotoComposerProps) {
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
          const img = readyPhotos[i]
          if (!img) return
          drawImageCover(originalCtx, img, slot)
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
          const img = readyPhotos[i]
          if (!img) return
          processedCtx.save()

          if (filterPreset && filterPreset.cssFilter !== 'none') {
            processedCtx.filter = filterPreset.cssFilter
          }

          drawImageCover(processedCtx, img, slot)
          processedCtx.restore()
        })

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
          processedCtx.shadowColor = sticker.outlineColor
          processedCtx.shadowBlur = Math.max(2, size * 0.08)
          if (sticker.src.startsWith('emoji:')) {
            processedCtx.fillText(sticker.src.slice(6), 0, 0)
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
  }, [bgColor, filterPreset, frame, photos, stickers])

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
      <div className={composing ? "opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-500 relative"}>
        <div ref={previewRef} />
        {!composing && stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            aria-label={`Di chuyển ${sticker.label}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-lg border-2 border-dashed border-fuchsia-400/70 bg-white/10 p-1 touch-none"
            style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.size * 100}%`, aspectRatio: '1', transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event: ReactPointerEvent<HTMLButtonElement>) => {
              const rect = event.currentTarget.parentElement?.getBoundingClientRect()
              if (!rect || !onStickerMove) return
              onStickerMove(sticker.id, Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)))
            }}
          >
            {sticker.src.startsWith('emoji:') ? sticker.src.slice(6) : <img src={sticker.src} alt="" className="h-full w-full object-contain" />}
          </button>
        ))}
      </div>
    </div>
  )
}
