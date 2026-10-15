# Spec — Frontend: Chụp ảnh + Ghép Frame + Download + Lưu lịch sử (Bước 3-6)

## Bối cảnh

Đã hoàn thành: `FramesModule` (upload frame + `layout_config`), `PhotosModule` (nhận `originalFile`/`processedFile`, upload R2, lưu DB, sinh `share_token`). Giờ làm phần Frontend để khách thực sự chụp được ảnh và ghép vào frame `Sweet Moments` (1x4).

---

## BƯỚC 3 — UI chụp ảnh (Camera + Countdown)

### Component `CameraCapture.tsx`

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  totalShots: number; // 4 cho frame 1x4
  onComplete: (photos: HTMLImageElement[]) => void;
}

export default function CameraCapture({ totalShots, onComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<HTMLImageElement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Xin quyền camera khi component mount
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 960 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.');
      }
    }
    initCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // 2. Chụp 1 ảnh từ frame video hiện tại
  function captureFrame(): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const video = videoRef.current!;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);

      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL('image/png');
    });
  }

  // 3. Đếm ngược rồi chụp, lặp lại đủ totalShots lần
  async function startCaptureSequence() {
    const photos: HTMLImageElement[] = [];
    for (let i = 0; i < totalShots; i++) {
      setShotIndex(i + 1);
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(0); // hiệu ứng "chụp"
      const photo = await captureFrame();
      photos.push(photo);
      setCapturedPhotos([...photos]);
      await new Promise((r) => setTimeout(r, 500)); // nghỉ ngắn trước lượt kế
    }
    setCountdown(null);
    onComplete(photos);
  }

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold bg-black/30">
          {countdown === 0 ? '📸' : countdown}
        </div>
      )}
      <div className="mt-2 text-center">
        Ảnh {shotIndex}/{totalShots}
      </div>
      <button
        onClick={startCaptureSequence}
        disabled={countdown !== null}
        className="mt-4 w-full py-3 bg-pink-500 text-white rounded-lg font-semibold disabled:opacity-50"
      >
        Bắt đầu chụp
      </button>
    </div>
  );
}
```

### Lưu ý khi implement

- `getUserMedia` **chỉ hoạt động qua HTTPS** (trừ `localhost`) — nếu deploy thử trên IP thường sẽ bị chặn.
- `facingMode: 'user'` = camera trước (mặc định hợp cho photobooth selfie). Đổi thành `'environment'` nếu muốn dùng camera sau trên điện thoại.
- Nên đợi `videoRef.current.videoWidth > 0` trước khi cho phép bấm "Bắt đầu chụp" — tránh trường hợp camera chưa kịp load mà đã chụp ra ảnh rỗng.

---

## BƯỚC 4 — Ghép ảnh vào Frame bằng Canvas

### Lấy frame từ API

```typescript
async function getFrame(frameId: string) {
  const res = await fetch(`/api/frames/${frameId}`);
  return res.json(); // { id, image_url, layout_config, ... }
}
```

### Hàm ghép ảnh (dùng lại đúng logic đã thiết kế trước)

```typescript
interface LayoutSlot { x: number; y: number; width: number; height: number; }
interface LayoutConfig { canvas_width: number; canvas_height: number; slots: LayoutSlot[]; }

async function composePhotoStrip(
  photos: HTMLImageElement[],
  frame: { image_url: string; layout_config: LayoutConfig },
): Promise<{ processedCanvas: HTMLCanvasElement; originalCanvas: HTMLCanvasElement }> {
  const { canvas_width, canvas_height, slots } = frame.layout_config;

  // Canvas "original" — chỉ 4 ảnh ghép đúng vị trí, CHƯA có frame đè lên
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = canvas_width;
  originalCanvas.height = canvas_height;
  const originalCtx = originalCanvas.getContext('2d')!;
  slots.forEach((slot, i) => drawImageCover(originalCtx, photos[i], slot.x, slot.y, slot.width, slot.height));

  // Canvas "processed" — copy từ original, vẽ thêm frame đè lên trên
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = canvas_width;
  processedCanvas.height = canvas_height;
  const processedCtx = processedCanvas.getContext('2d')!;
  processedCtx.drawImage(originalCanvas, 0, 0);

  const frameImg = new Image();
  frameImg.crossOrigin = 'anonymous'; // bắt buộc vì frame load từ R2 (domain khác)
  frameImg.src = frame.image_url;
  await new Promise((resolve) => (frameImg.onload = resolve));
  processedCtx.drawImage(frameImg, 0, 0, canvas_width, canvas_height);

  return { processedCanvas, originalCanvas };
}

// Vẽ ảnh kiểu "object-fit: cover" — tránh ảnh bị méo khi tỉ lệ khác slot
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const imgRatio = img.width / img.height;
  const slotRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > slotRatio) {
    sw = img.height * slotRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / slotRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
```

### Component preview kết quả

```typescript
function PhotoPreview({ canvas }: { canvas: HTMLCanvasElement }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.borderRadius = '12px';
      containerRef.current.appendChild(canvas);
    }
  }, [canvas]);

  return <div ref={containerRef} />;
}
```

---

## BƯỚC 5 — Nút Download + Lưu lịch sử (gọi API `POST /photos`)

```typescript
// Xuất canvas ra PNG, tải về máy ngay — không cần chờ server
function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = 'photobooth.png') {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Gọi API POST /photos để lưu lịch sử + lấy share_token cho QR
async function savePhotoToServer(
  processedCanvas: HTMLCanvasElement,
  originalCanvas: HTMLCanvasElement,
  customerId: string,
  frameId: string,
) {
  const [processedBlob, originalBlob] = await Promise.all([
    new Promise<Blob>((resolve) => processedCanvas.toBlob((b) => resolve(b!), 'image/png')),
    new Promise<Blob>((resolve) => originalCanvas.toBlob((b) => resolve(b!), 'image/png')),
  ]);

  const formData = new FormData();
  formData.append('customerId', customerId);
  formData.append('frameId', frameId);
  formData.append('mediaType', 'photo');
  formData.append('sessionType', 'single');
  formData.append('processedFile', processedBlob, 'processed.png');
  formData.append('originalFile', originalBlob, 'original.png');

  const res = await fetch('/api/photos', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Lưu ảnh thất bại');
  return res.json(); // { id, share_token, processed_file_url, ... }
}
```

### Component gộp toàn bộ luồng (Result screen)

```typescript
function ResultScreen({
  processedCanvas,
  originalCanvas,
  customerId,
  frameId,
}: {
  processedCanvas: HTMLCanvasElement;
  originalCanvas: HTMLCanvasElement;
  customerId: string;
  frameId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ share_token: string } | null>(null);

  async function handleSaveAndDownload() {
    setSaving(true);
    try {
      downloadCanvasAsPng(processedCanvas); // tải về ngay, không chờ
      const result = await savePhotoToServer(processedCanvas, originalCanvas, customerId, frameId);
      setSaved(result);
    } catch (err) {
      alert('Có lỗi khi lưu ảnh, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PhotoPreview canvas={processedCanvas} />
      <button onClick={handleSaveAndDownload} disabled={saving} className="mt-4 w-full py-3 bg-pink-500 text-white rounded-lg">
        {saving ? 'Đang lưu...' : 'Tải ảnh về'}
      </button>
      {saved && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Đã lưu! Link chia sẻ: /photo/{saved.share_token}
        </p>
      )}
    </div>
  );
}
```

> `saving` disable nút để tránh khách bấm nhiều lần gây tạo trùng nhiều record `Photo` cho cùng 1 lượt chụp.

---

## BƯỚC 6 — Test end-to-end

### Checklist luồng thật

- [ ] Vào trang chụp → trình duyệt hỏi quyền camera → cho phép → thấy video preview
- [ ] Bấm "Bắt đầu chụp" → đếm ngược đúng 3-2-1 → chụp → lặp đủ 4 lần, hiển thị đúng số thứ tự ảnh đang chụp
- [ ] Sau khi chụp đủ 4 ảnh → tự động ghép vào frame `Sweet Moments`, hiển thị preview đúng — ảnh nằm đúng 4 ô, không bị lệch/méo
- [ ] Bấm "Tải ảnh về" → file PNG tải xuống máy, mở ra thấy đúng ảnh đã ghép frame
- [ ] Kiểm tra R2 bucket → thấy 2 file mới trong `photos/<customerId>/` (1 original, 1 processed)
- [ ] Kiểm tra bảng `Photo` trong Neon → record mới có đúng `frame_id`, `customer_id`, `share_token`
- [ ] Mở `GET /photos/share/:shareToken` → trả về đúng ảnh, `download_count` tăng lên sau khi gọi

### Các trường hợp lỗi cần test thêm

- [ ] Từ chối quyền camera → hiển thị thông báo lỗi rõ ràng, không crash trắng trang
- [ ] Mất mạng giữa lúc upload → hiển thị lỗi "Lưu ảnh thất bại", ảnh vẫn tải về máy được (vì download chạy client-side, không phụ thuộc mạng)
- [ ] Thử bấm "Tải ảnh về" nhiều lần liên tục → không tạo ra nhiều record `Photo` trùng lặp (nhờ disable nút khi `saving = true`)

---

## Việc có thể làm sau (không bắt buộc cho milestone hiện tại)

- Trang xem ảnh qua QR (`/photo/[shareToken]`) — hiển thị `processed_file_url`, nút tải lại, nút share Facebook/Zalo
- Tạo QR code từ `share_token` bằng thư viện `qrcode` (npm) ngay sau khi lưu thành công
- Màn hình chọn frame trước khi vào chụp (`GET /frames` hiển thị danh sách cho khách chọn)
