# Spec — Chụp ảnh đơn (Single) + Ghép Frame 1x4 + Download PNG

## Bối cảnh

- Ảnh lưu trên **Cloudflare R2**, database **Neon Postgres**
- Bảng `Photo` đã thiết kế sẵn: `id`, `customer_id`, `frame_id`, `media_type`, `session_type`, `filters_applied`, `original_file_url`, `processed_file_url`, `thumbnail_url`, `status`, `share_token`, `download_count`, `expires_at`, `created_at`
- Mục tiêu: làm tính năng **chụp đơn (single)** với **frame 1x4** (4 ảnh ghép dọc thành photo strip) trước tiên

---

## 1. Vấn đề cần giải quyết trước: `Frame` thiếu thông tin vị trí từng ô ảnh

Bảng `Frame` hiện tại chỉ có `image_url` (file overlay) — thiếu tọa độ 4 ô ảnh cần ghép vào. Cần thêm field:

```
Frame
├── ... (các field đã có)
├── layout_config: jsonb NOT NULL
```

### Ví dụ `layout_config` cho frame 1x4 (dải dọc, canvas 600x1800)

```json
{
  "canvas_width": 600,
  "canvas_height": 1800,
  "slots": [
    { "x": 30, "y": 30,   "width": 540, "height": 405 },
    { "x": 30, "y": 465,  "width": 540, "height": 405 },
    { "x": 30, "y": 900,  "width": 540, "height": 405 },
    { "x": 30, "y": 1335, "width": 540, "height": 405 }
  ]
}
```

`image_url` của frame là 1 PNG cùng kích thước `600x1800`, nền trong suốt đúng 4 vị trí `slots`, phần viền/trang trí xung quanh vẽ sẵn.

---

## 2. Luồng xử lý tổng thể

```
1. Xin quyền camera (getUserMedia)
2. Chụp lần lượt 4 tấm ảnh (có đếm ngược mỗi lần)
3. Ghép 4 ảnh vào đúng vị trí slots trên canvas (theo layout_config)
4. Vẽ đè frame.image_url lên trên cùng canvas đó
5. Xuất canvas ra PNG (client-side, download ngay — không bắt buộc phải qua backend)
6. (Song song) Upload lên R2 qua API để lưu vào bảng Photo — phục vụ lịch sử, QR share
```

---

## 3. Code Frontend (React + Canvas API)

### Bước 1 — Chụp 4 ảnh từ camera

```typescript
async function capturePhoto(videoEl: HTMLVideoElement): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d')!.drawImage(videoEl, 0, 0);

  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  await new Promise((resolve) => (img.onload = resolve));
  return img;
}

// Gọi 4 lần, mỗi lần cách nhau đếm ngược
const capturedPhotos: HTMLImageElement[] = [];
for (let i = 0; i < 4; i++) {
  await countdown(3); // hàm đếm ngược hiển thị UI
  const photo = await capturePhoto(videoRef.current);
  capturedPhotos.push(photo);
}
```

### Bước 2 — Ghép 4 ảnh vào canvas theo `layout_config`, đè frame lên trên

```typescript
interface LayoutSlot { x: number; y: number; width: number; height: number; }
interface LayoutConfig { canvas_width: number; canvas_height: number; slots: LayoutSlot[]; }

async function composePhotoStrip(
  photos: HTMLImageElement[],
  frame: { image_url: string; layout_config: LayoutConfig },
): Promise<HTMLCanvasElement> {
  const { canvas_width, canvas_height, slots } = frame.layout_config;

  const canvas = document.createElement('canvas');
  canvas.width = canvas_width;
  canvas.height = canvas_height;
  const ctx = canvas.getContext('2d')!;

  // 1. Vẽ từng ảnh chụp vào đúng vị trí slot (crop kiểu "cover" để không bị méo)
  slots.forEach((slot, i) => {
    drawImageCover(ctx, photos[i], slot.x, slot.y, slot.width, slot.height);
  });

  // 2. Vẽ frame overlay đè lên trên cùng (frame có nền trong suốt ở vị trí slot)
  const frameImg = new Image();
  frameImg.crossOrigin = 'anonymous'; // bắt buộc vì frame load từ R2 (domain khác)
  frameImg.src = frame.image_url;
  await new Promise((resolve) => (frameImg.onload = resolve));
  ctx.drawImage(frameImg, 0, 0, canvas_width, canvas_height);

  return canvas;
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

### Bước 3 — Xuất PNG, download ngay (client-side, không cần chờ backend)

```typescript
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
```

### Bước 4 — Song song, upload lên backend để lưu vào `Photo`

```typescript
async function saveToServer(
  processedCanvas: HTMLCanvasElement,
  originalCanvas: HTMLCanvasElement,
  customerId: string,
  frameId: string,
) {
  const processedBlob = await new Promise<Blob>((resolve) =>
    processedCanvas.toBlob((b) => resolve(b!), 'image/png'),
  );
  const originalBlob = await new Promise<Blob>((resolve) =>
    originalCanvas.toBlob((b) => resolve(b!), 'image/png'),
  );

  const formData = new FormData();
  formData.append('customerId', customerId);
  formData.append('frameId', frameId);
  formData.append('sessionType', 'single');
  formData.append('processedFile', processedBlob, 'processed.png');
  formData.append('originalFile', originalBlob, 'original.png');

  const res = await fetch('/api/photos', { method: 'POST', body: formData });
  return res.json(); // trả về Photo record vừa tạo, gồm share_token để tạo QR
}
```

---

## 4. Backend — nhận 2 file, upload R2, lưu vào bảng `Photo`

```typescript
@Post()
@UseInterceptors(FileFieldsInterceptor([
  { name: 'processedFile', maxCount: 1 },
  { name: 'originalFile', maxCount: 1 },
]))
async create(
  @Body() dto: CreatePhotoDto,
  @UploadedFiles() files: { processedFile: Express.Multer.File[]; originalFile: Express.Multer.File[] },
) {
  const originalUrl = await this.storageService.uploadFile(dto.customerId, files.originalFile[0].buffer, 'png');
  const processedUrl = await this.storageService.uploadFile(dto.customerId, files.processedFile[0].buffer, 'png');

  return this.photosService.create({
    customer_id: dto.customerId,
    frame_id: dto.frameId,
    media_type: 'photo',
    session_type: 'single',
    original_file_url: originalUrl,
    processed_file_url: processedUrl,
    status: 'completed',
    share_token: uuid(),
  });
}
```

---

## 5. Vì sao vẫn cần `original_file_url` dù chỉ chụp đơn

`original_file_url` là bản **chưa ghép frame** (4 ảnh đặt cạnh nhau đúng vị trí, chưa có viền trang trí). Giữ lại để sau này làm tính năng "đổi frame khác" cho cùng 1 lượt chụp — chỉ cần vẽ lại bước ghép frame (đè frame mới lên `original`) mà không cần chụp lại ảnh.

---

## 6. Việc cần làm tiếp theo (chưa giải quyết trong spec này)

- [ ] **Tạo chức năng Frame** (CRUD + `layout_config`) — vì luồng chụp ảnh ở trên phụ thuộc hoàn toàn vào việc đã có ít nhất 1 frame hợp lệ với `layout_config` đúng định dạng
- [ ] Component UI countdown + quản lý state (đang chụp ảnh thứ mấy trong 4 tấm, preview trước khi lưu)
- [ ] Xử lý lỗi khi camera bị từ chối quyền truy cập
- [ ] Loading state khi đang upload lên R2 (tránh khách bấm nhiều lần)
