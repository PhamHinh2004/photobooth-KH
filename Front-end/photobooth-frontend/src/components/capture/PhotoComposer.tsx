import { useEffect, useRef, useState } from "react"
import { Spin } from "antd"
import type { Frame, LayoutSlot, FilterPreset } from "@/types/capture.types"

function toProxiedUrl(url: string): string {
  const r2Domain = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined
  if (r2Domain && url.startsWith(r2Domain)) {
    return url.replace(r2Domain, "/r2-proxy")
  }
  return url
}

interface PhotoComposerProps {
  photos: HTMLImageElement[]
  frame: Frame
  filterPreset?: FilterPreset | null
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

function ensureLoaded(img: HTMLImageElement): Promise<HTMLImageElement> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve(img)
  return new Promise((resolve, reject) => {
    const onLoad = () => { cleanup(); resolve(img) }
    const onError = () => { cleanup(); reject(new Error("Ảnh chụp bị lỗi")) }
    const cleanup = () => { img.removeEventListener("load", onLoad); img.removeEventListener("error", onError) }
    img.addEventListener("load", onLoad)
    img.addEventListener("error", onError)
    setTimeout(() => { cleanup(); reject(new Error("Timeout chờ ảnh")) }, 5000)
  })
}

export default function PhotoComposer({ photos, frame, filterPreset, onComplete }: PhotoComposerProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [composing, setComposing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState("")

  useEffect(() => {
    async function compose() {
      try {
        const { canvas_width, canvas_height, slots } = frame.layout_config

        console.log("[Composer] layout:", { canvas_width, canvas_height, slots_count: slots?.length })
        console.log("[Composer] photos:", photos.length)

        if (!slots || slots.length === 0) {
          throw new Error(`Frame "${frame.name}" không có slots`)
        }

        setDebugInfo(`${photos.length} ảnh - ${slots.length} slot - ${canvas_width}x${canvas_height}`)

        const readyPhotos = await Promise.all(photos.map(ensureLoaded))

        const originalCanvas = document.createElement("canvas")
        originalCanvas.width = canvas_width
        originalCanvas.height = canvas_height
        const originalCtx = originalCanvas.getContext("2d")!

        // Apply filter preset if present
        if (filterPreset && filterPreset.cssFilter !== 'none') {
          originalCtx.filter = filterPreset.cssFilter
        }

        slots.forEach((slot, i) => {
          const img = readyPhotos[i]
          if (!img) return
          drawImageCover(originalCtx, img, slot)
        })

        // Reset filter for frame draw
        originalCtx.filter = 'none'

        // Load frame image
        const frameImg = new Image()
        frameImg.crossOrigin = "anonymous"
        frameImg.src = toProxiedUrl(frame.image_url)

        await new Promise<void>((resolve, reject) => {
          frameImg.onload = () => resolve()
          frameImg.onerror = () => reject(new Error("Không tải được ảnh frame"))
          setTimeout(() => reject(new Error("Frame timeout 10s")), 10000)
        })

        // processedCanvas: FRAME + PHOTOS
        const processedCanvas = document.createElement("canvas")
        processedCanvas.width = canvas_width
        processedCanvas.height = canvas_height
        const processedCtx = processedCanvas.getContext("2d")!

        // 1. Draw frame background
        processedCtx.drawImage(frameImg, 0, 0, canvas_width, canvas_height)

        // 2. Draw photos with clipping inset and filter
        const INSET = 6
        slots.forEach((slot, i) => {
          const img = readyPhotos[i]
          if (!img) return
          processedCtx.save()
          processedCtx.beginPath()
          processedCtx.roundRect(
            slot.x + INSET, slot.y + INSET,
            slot.width - INSET * 2, slot.height - INSET * 2,
            12
          )
          processedCtx.clip()

          if (filterPreset && filterPreset.cssFilter !== 'none') {
            processedCtx.filter = filterPreset.cssFilter
          }

          drawImageCover(processedCtx, img, slot)
          processedCtx.restore()
        })

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        ref={previewRef}
        className={composing ? "opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-500"}
      />
    </div>
  )
}
