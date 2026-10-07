# Spec — Frontend Chụp Nhóm Realtime (Multi-Cam Room)

Đi kèm `group-capture-backend-spec.md` và `group-capture-test-guide.md`. Dựa trên 5 màn hình Figma: **Thiết lập phòng → Chọn khung & style → Phòng chờ → Buồng chụp multi-cam → Hậu kỳ & xuất bản**.

> **Giả định:** ví dụ viết bằng TypeScript, framework-agnostic ở tầng `api / realtime / media / compose`; chỉ phần state và hook mang tính minh họa kiểu React. Gateway backend đang cho phép origin `localhost:3000` và `localhost:5173` (gợi ý Vite). Nếu bạn dùng framework khác, chỉ cần đổi phần hook/store.

---

## 1. Nguyên tắc cốt lõi

1. **Host là người duy nhất ghép ảnh.** Khi đủ ảnh, chỉ client của host tải ảnh raw, ghép bằng canvas rồi gửi `original` + `processed` lên `POST /rooms/:id/compose`. Participant chỉ chụp và chờ.
2. **Mỗi người tự chụp từ camera của mình.** Đến đúng `triggerAt`, client lấy 1 khung hình từ video local, nén JPEG (≤ ~800KB) và upload lên `POST /rooms/:id/captures` (server lưu Redis).
3. **Video call do LiveKit lo.** Backend chỉ cấp token; frontend dùng `livekit-client` để hiện lưới camera ở Bước 3–4.
4. **Quyền thể hiện trên UI:** nút nào chỉ host dùng thì participant thấy dạng ẩn/khóa (Bước 3 "Vào buồng chụp", Bước 4 "Bắt đầu chụp", Bước 5 đăng bài).
5. **Trạng thái server là nguồn sự thật.** Refresh trang hoặc mất mạng thì khôi phục bằng `GET /rooms/code/:code`, không dựa vào state cục bộ.

---

## 2. Route và state máy

| Route | Bước | Điều kiện vào |
|---|---|---|
| `/group/new` | 1 — Thiết lập phòng | Đã đăng nhập |
| `/group/new/frame` | 2 — Khung & style | Có draft từ Bước 1, nếu không → về `/group/new` |
| `/group/join/:code` | Vào bằng mã/QR | Đã đăng nhập → `GET /rooms/code/:code` → `POST /rooms/:id/join` → chuyển sang lobby |
| `/group/:code/lobby` | 3 — Phòng chờ | Là participant, `status = WAITING` |
| `/group/:code/studio` | 4 — Buồng chụp | Là participant, `status = COUNTDOWN / CAPTURING` (hoặc host đã vào buồng, xem mục 9.2) |
| `/group/:code/result` | 5 — Hậu kỳ | Là participant, `status = POST_PRODUCTION / COMPLETED` |

**Khôi phục khi refresh:** gọi `GET /rooms/code/:code` rồi điều hướng theo `status`:

```
SETUP, WAITING          → /lobby
COUNTDOWN, CAPTURING    → /studio
POST_PRODUCTION, COMPLETED → /result
EXPIRED                 → màn "Phòng đã hết hạn" + nút "Tạo phòng mới"
```

---

## 3. Cấu trúc thư mục đề xuất

```
src/features/group-capture/
  api/        rooms.api.ts   frames.api.ts   posts.api.ts
  realtime/   roomSocket.ts  serverClock.ts  useRoomEvents.ts
  media/      useLiveKitRoom.ts   grabJpeg.ts
  compose/    drawImageCover.ts   composeGroupPhoto.ts
  store/      roomStore.ts
  pages/      SetupPage  FramePage  JoinPage  LobbyPage  StudioPage  ResultPage
  components/ StepProgress  FrameCard  StyleTabs  VideoTile  SlotPreview  CountdownOverlay  ...
```

---

## 4. Kiểu dữ liệu dùng chung

```typescript
// types.ts — khớp backend spec
export type RoomStatus = 'setup' | 'waiting' | 'countdown' | 'capturing' | 'post_production' | 'completed' | 'expired';
export type ParticipantStatus = 'joined' | 'ready' | 'captured' | 'left';

export interface LayoutSlot { x: number; y: number; width: number; height: number; }
export interface LayoutConfig { canvas_width: number; canvas_height: number; slots: LayoutSlot[]; }
export interface Frame { id: string; name: string; image_url: string; layout_config: LayoutConfig; }

export interface Participant {
  id: string; account_id: string; is_host: boolean;
  status: ParticipantStatus; slot_index: number;
  account: { username: string; avatar_url?: string };
}

export interface Room {
  id: string; room_code: string; host_account_id: string;
  max_participants: number; countdown_seconds: number;
  status: RoomStatus; expires_at: string; // ISO
  participants: Participant[];
  // Figma có thêm tên phòng + lobby timer → chờ backend bổ sung: name?: string; lobby_minutes?: number;
}

// Payload realtime (namespace /rooms)
export interface CaptureTrigger { roomId: string; triggerAt: number }          // ms, giờ server
export interface AllCaptured { roomId: string; slots: { slotIndex: number; username: string }[] }
```

---

## 5. Lớp dùng chung

### 5.1 API client

```typescript
// api/rooms.api.ts
const API = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${getToken()}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => null))?.message ?? res.statusText);
  return res.status === 204 ? (undefined as T) : res.json();
}
const json = (body: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export const roomsApi = {
  create: (dto: { maxParticipants: number; countdownSeconds: number }) => req<Room>('/rooms', json(dto)),
  selectFrame: (id: string, frameId: string) =>
    req(`/rooms/${id}/frame`, { ...json({ frameId }), method: 'PATCH' }),
  getByCode: (code: string) => req<Room>(`/rooms/code/${code}`),
  join: (id: string) => req(`/rooms/${id}/join`, json({})),
  ready: (id: string) => req(`/rooms/${id}/participants/me/ready`, { method: 'PATCH' }),
  livekitToken: (id: string) => req<{ token: string; url: string }>(`/rooms/${id}/livekit-token`, json({})), // dạng response: giả định
  startCountdown: (id: string) => req(`/rooms/${id}/start-countdown`, json({})),
  uploadCapture: (id: string, jpeg: Blob) => {
    const f = new FormData(); f.append('file', jpeg, 'capture.jpg');
    return req(`/rooms/${id}/captures`, { method: 'POST', body: f });
  },
  getCapture: async (id: string, slotIndex: number) => {            // chỉ host
    const res = await fetch(`${API}/rooms/${id}/captures/${slotIndex}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new ApiError(res.status, res.status === 410 ? 'Ảnh raw đã hết hạn, cần chụp lại' : 'Không tải được ảnh raw');
    return res.blob();
  },
  compose: (id: string, original: Blob, processed: Blob) => {        // chỉ host
    const f = new FormData(); f.append('original', original, 'original.png'); f.append('processed', processed, 'processed.png');
    return req<{ photo: any; sessionResult: any }>(`/rooms/${id}/compose`, { method: 'POST', body: f });
  },
  result: (id: string) => req(`/rooms/${id}/result`),
};
```

> Không tự set `Content-Type` khi gửi `FormData` — trình duyệt tự thêm boundary.

### 5.2 Socket

```typescript
// realtime/roomSocket.ts
import { io, Socket } from 'socket.io-client';

export function connectRoomSocket(token: string, roomId: string): Socket {
  const socket = io(`${import.meta.env.VITE_API_URL}/rooms`, { auth: { token } });
  // 'connect' bắn cả khi reconnect → tự vào lại room. Sau reconnect nên refetch room (mục 10).
  socket.on('connect', () => socket.emit('room:join', roomId));
  return socket;
}
```

| Event (server → client) | Hiệu ứng UI |
|---|---|
| `room:frame_selected` `{roomId, frameId}` | Cập nhật khung đang chọn ở lobby |
| `room:participant_joined` `participant` | Thêm người vào lưới/lobby, tăng "x/N thành viên" |
| `room:countdown_started` `{countdownSeconds}` | Hiện overlay "3… 2… 1… Cười lên nào!" ở Bước 4 |
| `room:capture_trigger` `{triggerAt}` | Hẹn giờ chụp (mục 8.1) |
| `room:participant_captured` `{slotIndex}` | Lấp đầy ô slot tương ứng ở preview khung, "Tiến trình slot x/N" |
| `room:all_captured` `{slots}` | **Host:** bắt đầu tải + ghép + gửi `/compose`. **Participant:** hiện "Đang ghép ảnh…" |
| `room:composed_ready` `{photo, sessionResult}` | Chuyển sang Bước 5, hiện ảnh |

### 5.3 Đồng hồ server (tùy chọn)

`triggerAt` là mốc giờ **server**. Nếu đồng hồ thiết bị lệch, người chụp sẽ lệch nhau. Hai mức:

- **Mặc định:** dùng `Date.now()` trực tiếp (máy bật tự đồng bộ giờ thường lệch dưới ~100ms).
- **Chính xác hơn:** cần backend thêm handler `time:sync` trả `Date.now()` qua ack. Phía client:

```typescript
// realtime/serverClock.ts
let offsetMs = 0; // serverTime - clientTime
export async function syncClock(socket: Socket, rounds = 5) {
  const samples: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = Date.now();
    const serverNow: number = await socket.timeout(2000).emitWithAck('time:sync');
    const t1 = Date.now();
    samples.push(serverNow - (t0 + t1) / 2);
  }
  offsetMs = samples.sort((a, b) => a - b)[Math.floor(rounds / 2)]; // lấy trung vị
}
export const serverNow = () => Date.now() + offsetMs;
```

Chưa có `time:sync` ở backend thì giữ `offsetMs = 0`.

---

## 6. Màn hình theo từng bước

### Bước 1 — Thiết lập phòng (`/group/new`)

| Thành phần (theo Figma) | Hành vi |
|---|---|
| Tên phòng chụp + gợi ý nhanh (chip) | Input có giá trị mặc định; bấm chip để điền. Giới hạn độ dài (đề xuất 40 ký tự) |
| Số lượng thành viên 2–8 (mặc định 4, nhãn "Chuẩn nhóm") | Một nhóm nút chọn 1 giá trị; thay đổi → cập nhật preview bên phải |
| Banner "Gợi ý bố cục khung thông minh" | Nội dung đổi theo số người |
| Thời gian chờ phòng (Lobby Timer): 2.0 / 2.5 / 3.0 phút | Chọn 1 giá trị, mặc định 2.0. Ghi chú: đồng hồ bắt đầu khi thành viên thứ 2 vào phòng |
| Panel "Mô phỏng phòng chờ" + "Khung ảnh được đề xuất" | Chỉ hiển thị, dựng từ `maxParticipants` |
| Nút "Tiếp tục: chọn khung & style" | Lưu **draft** `{name, maxParticipants, lobbyMinutes}` vào store → `/group/new/frame`. **Chưa gọi API** |
| Nút "Quay lại trang chủ" | Hủy draft |

> Figma tạo phòng ở cuối Bước 2 ("Khởi tạo phòng chụp"), nên Bước 1 chỉ là draft cục bộ.

### Bước 2 — Khung & style (`/group/new/frame`)

| Thành phần | Hành vi |
|---|---|
| Phần 1: thẻ bố cục (Grid 2×2, 1×4 dọc, 4×2 Postcard) với nhãn "Chụp 1 lần / 2 lần" | Lấy từ `GET /frames`, **lọc theo số slot khớp số người** (`layout_config.slots.length === maxParticipants`). Thẻ không phù hợp thì mờ + tooltip. Khung 8 slot chụp 2 lần xem mục 11 |
| Phần 2: tab style (Marvel / Comic Pop, Y2K Cyber Glow, Retro Slim Film, Anime Sakura, Minimalism Clean) + danh sách thẻ style | Mỗi cặp (bố cục, style) tương ứng 1 `Frame`; chọn xong có `frameId` |
| Thanh đáy "Cấu hình đã chọn: Nhóm N người • Khung … • Style: …" | Cập nhật theo lựa chọn; nút chính chỉ bật khi đã chọn đủ bố cục + style |
| "Quay lại Bước 1" | Giữ nguyên draft |
| **"Khởi tạo phòng chụp"** | Gọi tuần tự `roomsApi.create(...)` → `roomsApi.selectFrame(room.id, frameId)` → `/group/:room_code/lobby`. Lỗi giữa chừng: hiện toast, giữ nguyên trang, cho bấm lại (nếu `create` đã thành công thì chỉ thử lại `selectFrame`) |

### Bước 3 — Phòng chờ (`/group/:code/lobby`)

| Thành phần | Nguồn / Hành vi |
|---|---|
| Tiêu đề phòng, nhãn "Public Booth", "Khung chụp: 2×2 … · N slot đồng bộ" | `room` + frame đã chọn |
| Đồng hồ "Thời gian còn lại" | Đếm ngược tới `expires_at`; về 0 mà chưa đủ người → gọi lại `GET /rooms/code/:code`, nếu `EXPIRED` thì hiện màn hết hạn |
| Thẻ `ROOM_CODE`: mã (`KH-8899-Y2K`), "Sao chép mã", "Quét mã QR", QR, nút chia sẻ (Zalo / Messenger / AirDrop) | QR mã hóa URL `${APP_URL}/group/join/${room_code}`; chia sẻ dùng Web Share API, fallback sao chép link |
| "Sức chứa phòng x/N thành viên" | `participants.length` / `max_participants` |
| Toggle "Đồng bộ tạo Sticker & Filter" (quyền trưởng phòng) | Chỉ host thấy bật/tắt; backend chưa có (mục 11) → ẩn hoặc khóa |
| Lưới "Khung trực tiếp" (video tile + trạng thái "Sẵn sàng (Camera & Mic On)", "Đã vào", "Vừa vào", chờ) | `useLiveKitRoom` (mục 7) + `participants[].status` |
| Banner "Cả N người đã sẵn sàng!" + nút **"Vào buồng chụp ngay (N/N đã sẵn sàng)"** | **Chỉ host** bấm được, bật khi `participants.length === max_participants` và tất cả `READY`. Điều kiện chặt vì backend yêu cầu số ảnh bằng số slot |

Luồng của mỗi participant ở lobby:
1. Vào phòng (qua mã/QR) → `GET /rooms/code` → `POST /rooms/:id/join` (nếu chưa là participant).
2. Xin quyền camera/mic → `roomsApi.livekitToken` → kết nối LiveKit → bật camera.
3. Camera lên → `roomsApi.ready(room.id)`.
4. Lắng nghe `room:participant_joined`; vì backend chưa có event "ready/left", **poll `GET /rooms/code/:code` mỗi 3–5s** để cập nhật trạng thái (bỏ poll khi backend bổ sung event).

### Bước 4 — Buồng chụp trực tuyến (`/group/:code/studio`)

| Thành phần | Hành vi |
|---|---|
| Header: mã phòng, "Host: …", chip "Tiến trình slot x/N", overlay đếm ngược "3… 2… 1… Cười lên nào!" | Đếm theo `countdownSeconds` từ `room:countdown_started`; tiến trình tăng theo `room:participant_captured` |
| Chip "REC BTS (MP4 1080p)" | Backend chưa có quay video → ẩn trong MVP |
| Lưới video N camera (tên, nhãn CAM_xx) | Tile LiveKit; tile của mình lật gương bằng CSS (`scaleX(-1)`), ảnh chụp **không** lật |
| Panel "Khung Marvel 2×2" với các ô "Chờ slot x" | Dựng từ `frame.layout_config`; ô nào có `participant_captured` thì đánh dấu đã chụp (có thể hiện ảnh xem trước cục bộ của chính mình) |
| Khối "Hướng dẫn pose" | Nội dung tĩnh/gợi ý |
| Nút **"Bắt đầu chụp tự động"** (có "nghỉ 3s") | Chỉ host: `roomsApi.startCountdown(room.id)`, rồi khóa nút cho tới khi xong |
| Nút "Sang hậu kỳ & review" | Chỉ bật sau khi `room:composed_ready` (hoặc host đang ghép thì hiện "Đang ghép ảnh…") |
| Khối "Voice chat trực tiếp" | Dùng audio của LiveKit; chỉ hiện trạng thái mic/mute |
| Danh sách "Các thành viên" | `participants` |

### Bước 5 — Hậu kỳ & xuất bản (`/group/:code/result`)

| Thành phần | Hành vi |
|---|---|
| Preview ảnh ghép + "Đồng bộ N/N thiết bị" | Ảnh `photo.processed_file_url`; lấy lại bằng `GET /rooms/:id/result` khi refresh |
| "Đang online trong phòng" | Danh sách avatar từ participants/LiveKit |
| Hậu kỳ cộng tác theo lượt (bộ lọc màu, AR particle, sticker, "Slot #1 của bạn") | Backend chưa hỗ trợ chỉnh sửa từng slot → MVP chỉ xem (mục 11) |
| Đánh giá trải nghiệm (5 sao + góp ý) + "Gửi đánh giá & Hoàn tất" | Chưa có endpoint → ẩn hoặc lưu tạm cục bộ (mục 11) |
| "Tải ảnh in sắc nét" | Tải ảnh `processed_file_url` về máy (mục 8.3) |
| "Tải video kỷ niệm (MP4)" | Backend chưa có → ẩn trong MVP |
| QR "Quét mã tải về điện thoại" | Mã hóa URL chia sẻ dựng từ `photo.share_token` (cần một route công khai phía FE/BE để xem ảnh theo token) |
| Nút đăng bài | **Chỉ host**: `POST /posts` với `sessionResultId`. Participant không thấy nút (backend vẫn trả `403` nếu cố gọi) |
| "Tạo phòng mới" | Xóa state phòng, về `/group/new` |

---

## 7. LiveKit (Bước 3–4)

```typescript
// media/useLiveKitRoom.ts (rút gọn)
import { Room as LkRoom, RoomEvent } from 'livekit-client';

export async function joinLivekit(roomId: string) {
  const { token, url } = await roomsApi.livekitToken(roomId);
  const lk = new LkRoom({ adaptiveStream: true, dynacast: true });
  await lk.connect(url, token);
  await lk.localParticipant.enableCameraAndMicrophone();
  return lk;
}
// Gắn track vào VideoTile bằng RoomEvent.TrackSubscribed; dọn dẹp bằng lk.disconnect() khi rời trang.
```

Lưu ý:
- Khớp tile với participant bằng `identity` của LiveKit — thống nhất với backend dùng `account_id` (hoặc `username`) làm identity khi cấp token.
- Rời trang studio/lobby phải `disconnect()` và dừng các track để tắt đèn camera.
- Lỗi từ chối quyền camera: hiện hướng dẫn bật lại quyền; không cho `ready`.

---

## 8. Chụp, upload và ghép ảnh

### 8.1 Chụp đúng `triggerAt` và upload

```typescript
// StudioPage — mọi người dùng chung
socket.on('room:capture_trigger', ({ triggerAt }: CaptureTrigger) => {
  const wait = Math.max(0, triggerAt - serverNow());
  setTimeout(async () => {
    try {
      const jpeg = await grabJpeg(localVideoEl);              // mục 8.2
      await retry(() => roomsApi.uploadCapture(room.id, jpeg), 2); // thử lại tối đa 2 lần
      markMyShotDone();
    } catch (e) {
      showError('Chụp/upload thất bại, bấm "Chụp lại"');      // cho phép chụp bù (backend ~10s)
    }
  }, wait);
});
```

### 8.2 Lấy khung hình và nén JPEG ≤ ~800KB

```typescript
// media/grabJpeg.ts
const MAX_BYTES = 800 * 1024;

export async function grabJpeg(video: HTMLVideoElement, maxWidth = 1280): Promise<Blob> {
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.75, 0.65, 0.5]) {            // giảm dần cho tới khi đủ nhỏ
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('Không nén được ảnh dưới 800KB');
}
```

### 8.3 Host ghép ảnh

```typescript
// compose/drawImageCover.ts — object-fit: cover, ưu tiên giữ phần đầu/mặt
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap | HTMLImageElement,
  slot: LayoutSlot,
  verticalBias = 0.3,            // 0 = lấy sát trên, 0.5 = chính giữa
) {
  const sr = img.width / img.height, dr = slot.width / slot.height;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (sr > dr) { sw = img.height * dr; sx = (img.width - sw) / 2; }       // ảnh rộng hơn → cắt hai bên
  else { sh = img.width / dr; sy = (img.height - sh) * verticalBias; }    // ảnh cao hơn → cắt trên/dưới, lệch lên
  ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.width, slot.height);
}
```

```typescript
// compose/composeGroupPhoto.ts — 2 lớp giống chụp đơn
export async function composeGroupPhoto(opts: {
  images: ImageBitmap[];           // đã theo thứ tự slotIndex ASC
  layout: LayoutConfig;
  frameImageUrl: string;
}) {
  const { images, layout, frameImageUrl } = opts;
  if (images.length !== layout.slots.length) throw new Error('Số ảnh không khớp số slot của khung');

  const frameImg = await loadImage(frameImageUrl);            // img.crossOrigin = 'anonymous'
  const canvas = document.createElement('canvas');
  canvas.width = layout.canvas_width; canvas.height = layout.canvas_height;
  const ctx = canvas.getContext('2d')!;

  // Lớp 1 — original: chỉ ảnh capture trong từng slot, chưa có frame
  images.forEach((img, i) => drawImageCover(ctx, img, layout.slots[i]));
  const originalBlob = await toBlob(canvas, 'image/png');

  // Lớp 2 — processed: vẽ frame đè lên trên cùng cùng canvas đó
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  const processedBlob = await toBlob(canvas, 'image/png');

  return { originalBlob, processedBlob };
}
```

```typescript
// StudioPage — chỉ host
socket.on('room:all_captured', async ({ roomId, slots }: AllCaptured) => {
  if (!isHost) { setPhase('composing'); return; }
  setPhase('composing');
  try {
    const images = await Promise.all(
      slots.map(async ({ slotIndex }) => createImageBitmap(await roomsApi.getCapture(roomId, slotIndex))),
    );
    const { originalBlob, processedBlob } = await composeGroupPhoto({
      images, layout: frame.layout_config, frameImageUrl: frame.image_url,
    });
    await roomsApi.compose(roomId, originalBlob, processedBlob);  // thành công → server bắn room:composed_ready
  } catch (e) { handleComposeError(e); }                          // mục 10
});
```

Lưu ý:
- Ảnh raw lấy qua `fetch → blob → createImageBitmap` nên cùng origin, canvas không bị tainted. Riêng **ảnh frame overlay** nếu ở origin khác (R2/CDN) vẫn cần `crossOrigin = 'anonymous'` và server trả header CORS, giống luồng chụp đơn.
- `slots` do server trả đã sắp theo `slotIndex ASC`; `images[i]` ↔ `layout.slots[i]`. Có "lỗ hổng" slot là ảnh sẽ sai chỗ.
- Backend `compose` idempotent nên host bấm/gửi lại không tạo trùng.

### 8.4 Tải ảnh về máy

```typescript
export async function downloadImage(url: string, filename: string) {
  const blob = await (await fetch(url)).blob();                 // fetch → blob để thuộc tính download hoạt động
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}
```

---

## 9. Quyền hạn và các điểm chuyển bước

### 9.1 Ma trận ai làm được gì

| Hành động | Host | Participant |
|---|:-:|:-:|
| Sửa khung, toggle đồng bộ ở lobby | ✅ | ❌ (chỉ xem) |
| "Vào buồng chụp", "Bắt đầu chụp" | ✅ | ❌ |
| Chụp + upload ảnh của mình | ✅ | ✅ |
| Tải ảnh raw, ghép, `/compose` | ✅ | ❌ |
| Đăng bài (`POST /posts`) | ✅ | ❌ |
| Tải ảnh/QR kết quả | ✅ | ✅ |

### 9.2 Chuyển Bước 3 → 4 (backend chưa có sự kiện)

Backend hiện không có event "host vào buồng chụp". Đề xuất backend thêm `room:enter_studio` (hoặc đổi `status`) để cả phòng cùng được chuyển trang. Tạm thời có thể dùng `room:countdown_started` làm tín hiệu cho participant; nhưng như vậy participant chưa vào được buồng trước khi đếm ngược. Cách sạch nhất vẫn là thêm event.

---

## 10. Lỗi và mất kết nối

| Tình huống | Xử lý trên UI |
|---|---|
| `410 Gone` khi host tải ảnh raw | "Ảnh đã hết hạn" → yêu cầu chụp lại slot thiếu |
| `413` / `400` khi upload ảnh | Nén lại (`grabJpeg` giảm quality) rồi thử lại; nếu vẫn lỗi hiện thông báo |
| `403` ở các nút chỉ host | Ẩn nút từ đầu; nếu vẫn gặp thì toast "Bạn không có quyền" |
| `compose` lỗi mạng | Giữ nguyên blob đã ghép trong bộ nhớ và cho bấm "Gửi lại" (đừng ghép lại từ đầu) |
| Phòng `EXPIRED` | Màn hết hạn + "Tạo phòng mới" |
| Socket rớt rồi nối lại | `connect` tự `room:join` lại; sau đó refetch `GET /rooms/code/:code` để đồng bộ trạng thái đã lỡ |
| Host refresh sau khi đủ ảnh, đã lỡ `all_captured` | Khi mở lại studio, nếu tất cả participant `CAPTURED` mà chưa có kết quả → tự chạy lại quy trình ghép (mục 8.3) |
| Từ chối quyền camera/mic | Màn hướng dẫn mở quyền; không cho `ready` |
| Một người rời giữa chừng | Ô slot đó hiện "đã rời"; host có thể mời người khác hoặc chụp bù (theo backend §9) |

---

## 11. Lệch giữa Figma và backend, đề xuất cho MVP

Các điểm này nằm ở mục 2 của `group-capture-test-guide.md`. Cột đề xuất là gợi ý, bạn chốt lại.

| Hạng mục Figma | Backend hiện tại | Đề xuất MVP phía FE |
|---|---|---|
| Tên phòng, Lobby Timer 2/2.5/3 phút | `Room` chưa có `name`, `lobby_minutes` | Giữ UI, chỉ gửi khi backend thêm field |
| Khung 4×2 (8 slot, chụp 2 lần) | Giả định 1 ảnh/người, số slot = số người | Khóa thẻ này, ghi "Sắp có" |
| Hậu kỳ theo lượt (filter, sticker, đồng bộ sticker) | Không có event/endpoint chỉnh sửa từng slot | Bước 5 chỉ xem + tải; ẩn tab filter/sticker và toggle đồng bộ |
| REC BTS, video MP4 | Có entity `Recording`, chưa có luồng tạo | Ẩn chip REC và nút tải MP4 |
| Đánh giá 5 sao + góp ý | Chưa có endpoint | Ẩn, hoặc lưu cục bộ cho demo |
| Trạng thái "Sẵn sàng/Đã vào" realtime | Chưa có event ready/left | Poll `GET /rooms/code/:code` mỗi 3–5s |
| "Vào buồng chụp" cho cả phòng | Chưa có event chuyển studio | Đề xuất backend thêm `room:enter_studio` |
| Đồng bộ giờ chính xác | Chưa có `time:sync` | Dùng `Date.now()`; thêm sau |

---

## 12. Checklist frontend

- [ ] Bước 1–2 chỉ lưu draft; chỉ gọi API khi bấm "Khởi tạo phòng chụp"
- [ ] Khung gợi ý được lọc theo số người; thẻ không phù hợp bị mờ
- [ ] Lobby: mã phòng, QR, chia sẻ hoạt động; join bằng QR/mã đi đúng luồng
- [ ] Danh sách thành viên cập nhật (event + poll) và nút "Vào buồng chụp" chỉ bật khi đủ người và tất cả sẵn sàng
- [ ] Từ chối quyền camera → có hướng dẫn, không cho `ready`
- [ ] Đếm ngược hiển thị đồng bộ; mọi client chụp tại `triggerAt` (đo độ lệch ≤ ~200ms)
- [ ] Ảnh upload là JPEG ≤ 800KB; thất bại thì tự thử lại và cho chụp lại
- [ ] Chỉ client host ghép và gọi `/compose`; participant thấy "Đang ghép ảnh…"
- [ ] Ảnh ghép đúng thứ tự slot, không méo, không cắt mất đầu người
- [ ] Sau `room:composed_ready` cả phòng chuyển sang Bước 5 và thấy cùng một ảnh
- [ ] Refresh ở bất kỳ bước nào cũng quay lại đúng trang theo `status`
- [ ] Participant không thấy nút đăng bài; host đăng bài thành công
- [ ] Rời trang thì LiveKit `disconnect()` và camera tắt
- [ ] Test 2 thiết bị thật qua HTTPS (camera điện thoại cần HTTPS)
