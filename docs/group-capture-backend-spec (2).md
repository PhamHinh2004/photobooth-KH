# Spec — Backend cho Chụp Nhóm Realtime (Multi-Cam Room)

## Bối cảnh

Theo 5 bước Figma: Host tạo phòng → chọn Frame + Style → phòng chờ chia sẻ mã/QR → buồng chụp trực tuyến multi-cam (N người cùng lúc) → hậu kỳ + xuất bản. Schema database đã được tối ưu lại qua nhiều vòng — đây là bản chốt cuối cùng, khớp đúng ERD mới nhất.

> **Cập nhật — luồng ghép ảnh mới:** ảnh raw của từng người được lưu tạm trên **Redis (Upstash free)**; **host** tải về, ghép bằng `canvas` ở client (dùng lại đúng hàm của chụp đơn) rồi gửi `original` + `processed` lên `POST /rooms/:id/compose`. Server **không** ghép ảnh (bỏ `sharp`) và **không** còn bảng `RoomCapture`.

---

## 1. Quyết định kiến trúc

| Thành phần | Tự xây | Dùng dịch vụ ngoài |
|---|---|---|
| Logic phòng (tạo phòng, join, slot, trạng thái) | ✅ Backend NestJS | |
| Đồng bộ "bấm chụp cùng lúc" | ✅ Socket.io Gateway | |
| **Truyền hình ảnh video call giữa nhiều người** | | ✅ **LiveKit** (self-host miễn phí) |
| Lưu ảnh raw tạm thời của từng người | ✅ Redis (Upstash free) — key `room:{roomCode}:{username}:{slotIndex}`, TTL theo hạn phòng | |
| Ghép frame (canvas) | ✅ Client của **host** — dùng lại hàm ghép của chụp đơn + `layout_config` | |
| Lưu ảnh kết quả | ✅ Backend (tái dùng `StorageService`), nhận `original` + `processed` từ host | |

Backend chỉ cấp **token** để client kết nối vào phòng video LiveKit — không tự truyền tải video. Tự xây SFU không khả thi trong thời gian đồ án.

---

## 2. Nguyên tắc phân quyền cốt lõi

**Chỉ Host của phòng được quyền rate/đăng bài (Post)** — dù phòng có nhiều `RoomParticipant`, kết quả cuối cùng (`Photo`, `Session_Result`) chỉ thuộc về **1 account duy nhất: host**. Participant khác chỉ là người tham gia tạo nội dung, không sở hữu kết quả.

```
Room (nhiều participant)
   └── finalizeRoomPhoto()   ← host gửi ảnh đã ghép lên POST /rooms/:id/compose
          └── Photo.account_id = room.host_account_id   ← chỉ 1 chủ sở hữu
          └── Session_Result.account_id = room.host_account_id
```

Nhờ đặt `account_id` trực tiếp trên `Session_Result`, logic kiểm tra quyền đăng bài **dùng chung được cho cả chụp đơn lẫn chụp nhóm**, không cần rẽ nhánh riêng ở tầng `PostsService`.

---

## 3. Entities

### `Room`

```typescript
// rooms/entities/room.entity.ts
export enum RoomStatus {
  SETUP = 'setup',
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  CAPTURING = 'capturing',
  POST_PRODUCTION = 'post_production',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  room_code: string; // mã ngắn để join, hiển thị + QR ở Bước 3

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'host_account_id' })
  host: Account;

  @Column()
  host_account_id: string;

  @Column({ type: 'int' })
  max_participants: number;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.SETUP })
  status: RoomStatus;

  @Column({ type: 'int', default: 5 })
  countdown_seconds: number;

  @Column({ nullable: true })
  livekit_room_name: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamptz' })
  expires_at: Date;
}
```

> **`Room` không có `frame_id`**: frame do host chọn ở Bước 2 chỉ tồn tại **tạm thời trong bộ nhớ server** (xem mục 5), chính thức gắn vào dữ liệu lúc tạo `Photo` ở cuối luồng. Đánh đổi: nếu server restart giữa lúc phòng đang hoạt động, lựa chọn frame sẽ mất, phòng phải chọn lại — chấp nhận được với quy mô đồ án.

### `RoomParticipant`

```typescript
// rooms/entities/room-participant.entity.ts
export enum ParticipantStatus {
  JOINED = 'joined',
  READY = 'ready',
  CAPTURED = 'captured',
  LEFT = 'left',
}

@Entity('room_participant')
@Unique(['room_id', 'slot_index'])
@Unique(['room_id', 'account_id'])
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  room_id: string;

  @Column()
  account_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ default: false })
  is_host: boolean;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.JOINED })
  status: ParticipantStatus;

  @Column({ type: 'int' })
  slot_index: number;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;
}
```

### ~~`RoomCapture`~~ — đã bỏ

Ảnh raw của từng participant **không còn lưu trong database**. Mỗi ảnh nằm trên Redis (mục 5.1) cho tới khi host ghép xong. Trạng thái "đã chụp" dựa vào `RoomParticipant.status = CAPTURED`; `slot_index` đã unique trên `RoomParticipant` nên không cần thêm bảng.

### `Session_Result` — bảng trung tâm nối Photo / Recording / Gift

```typescript
// sessions/entities/session-result.entity.ts
export enum SessionResultType {
  SINGLE = 'single',
  GROUP = 'group',
}

export enum SessionResultStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('session_result')
export class SessionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  account_id: string; // single: người chụp | group: host của Room

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'enum', enum: SessionResultType })
  session_type: SessionResultType;

  @Column({ nullable: true })
  room_id: string | null; // chỉ có giá trị khi session_type = group

  @Column({ nullable: true })
  photo_id: string | null;

  @Column({ nullable: true })
  recording_id: string | null;

  @Column({ nullable: true })
  gift_id: string | null;

  @Column({ type: 'enum', enum: SessionResultStatus, default: SessionResultStatus.PENDING })
  status: SessionResultStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
```

### `Photo` (bản chốt — `account_id` và `frame_id` đều NOT NULL)

```typescript
// photos/entities/photo.entity.ts
export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
}

export enum PhotoStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('photo')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  account_id: string; // luôn có chủ sở hữu — chụp đơn: chính họ | chụp nhóm: host

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  frame_id: string; // bắt buộc — mọi Photo đều xuất phát từ 1 frame cụ thể

  @ManyToOne(() => Frame)
  @JoinColumn({ name: 'frame_id' })
  frame: Frame;

  @Column({ type: 'enum', enum: MediaType })
  media_type: MediaType;

  @Column({ type: 'jsonb', nullable: true })
  filters_applied: string[] | null;

  @Column()
  original_file_url: string;

  @Column({ nullable: true })
  processed_file_url: string | null;

  @Column({ nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'enum', enum: PhotoStatus, default: PhotoStatus.PROCESSING })
  status: PhotoStatus;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ unique: true })
  share_token: string;

  @Column({ default: 0 })
  download_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

> **Thay đổi quan trọng so với bản trước**: `Photo` **không còn** `session_id`/`room_id` trực tiếp — quan hệ giờ đi theo chiều ngược lại, `Session_Result.photo_id` trỏ **vào** `Photo`. Logic này áp dụng chung cho cả chụp đơn và chụp nhóm, không cần cột rẽ nhánh nào trên `Photo`.

### `Recording`

```typescript
// recordings/entities/recording.entity.ts
export enum RecordingStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('recording')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file_url: string;

  @Column({ nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'int' })
  duration_seconds: number;

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.PROCESSING })
  status: RecordingStatus;
}
```

### `Gift`

```typescript
// gifts/entities/gift.entity.ts
export enum GiftType {
  VOUCHER = 'voucher',
  STICKER = 'sticker',
  DISCOUNT_CODE = 'discount_code',
}

@Entity('gift')
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GiftType })
  gift_type: GiftType;

  @Column()
  image_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

---

## 4. REST API

| Method | Endpoint | Mô tả | Bước Figma |
|---|---|---|---|
| `POST` | `/rooms` | Host tạo phòng (`maxParticipants`, `countdownSeconds`) | Bước 1 |
| `PATCH` | `/rooms/:id/frame` | Host chọn frame (lưu in-memory, broadcast qua socket) | Bước 2 |
| `GET` | `/rooms/code/:roomCode` | Lấy thông tin phòng cho màn chờ | Bước 3 |
| `POST` | `/rooms/:id/join` | Participant join bằng `room_code`, gán `slot_index` | Bước 3 |
| `POST` | `/rooms/:id/livekit-token` | Cấp token kết nối video LiveKit | Bước 3→4 |
| `PATCH` | `/rooms/:id/participants/me/ready` | Báo đã sẵn sàng (bật cam) | Bước 4 |
| `POST` | `/rooms/:id/start-countdown` | Chỉ host gọi, đếm ngược đồng bộ | Bước 4 |
| `POST` | `/rooms/:id/captures` | Participant upload ảnh raw (JPEG ≤ ~800KB) → lưu **Redis** | Bước 4 |
| `GET` | `/rooms/:id/captures/:slotIndex` | **Chỉ host**: lấy ảnh raw của 1 slot từ Redis (`410` nếu hết TTL) | Bước 5 |
| `POST` | `/rooms/:id/compose` | **Chỉ host**: gửi `original` + `processed` đã ghép ở client → tạo `Photo` + `Session_Result` | Bước 5 |
| `GET` | `/rooms/:id/result` | Lấy `Session_Result` + `Photo` đã ghép xong | Bước 5 |

### Controller — các endpoint chính

```typescript
// rooms/rooms.controller.ts
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(user.id, dto);
  }

  @Patch(':id/frame')
  selectFrame(@Param('id') roomId: string, @Body('frameId') frameId: string) {
    return this.roomsService.selectFrame(roomId, frameId);
  }

  @Post(':id/join')
  join(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.join(roomId, user.id);
  }

  @Post(':id/start-countdown')
  async startCountdown(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    await this.roomsService.assertIsHost(roomId, user.id);
    return this.roomsService.startCountdown(roomId);
  }

  /** Participant upload ảnh raw → lưu Redis. Giữ ảnh nhỏ vì Upstash free giới hạn kích thước request. */
  @Post(':id/captures')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 800 * 1024 }, // client gửi JPEG quality ~0.85, rộng tối đa ~1280px
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'image/jpeg'),
    }),
  )
  submitCapture(
    @Param('id') roomId: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Cần gửi ảnh JPEG tối đa ~800KB');
    return this.roomsService.submitCapture(roomId, user.id, file.buffer);
  }

  /** Chỉ host: lấy ảnh raw của 1 slot. Client KHÔNG nối thẳng Redis (sẽ lộ password Upstash). */
  @Get(':id/captures/:slotIndex')
  async getCapture(
    @Param('id') roomId: string,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    await this.roomsService.assertIsHost(roomId, user.id);
    const buf = await this.roomsService.getCaptureBuffer(roomId, slotIndex);
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }).send(buf);
  }

  /** Chỉ host: gửi 2 file đã ghép ở client */
  @Post(':id/compose')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'original', maxCount: 1 },
        { name: 'processed', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  async compose(
    @Param('id') roomId: string,
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: { original?: Express.Multer.File[]; processed?: Express.Multer.File[] },
  ) {
    if (!files?.original?.[0] || !files?.processed?.[0]) {
      throw new BadRequestException('Thiếu file original hoặc processed');
    }
    return this.roomsService.finalizeRoomPhoto(
      roomId,
      user.id,
      files.original[0].buffer,
      files.processed[0].buffer,
    );
  }
}
```

---

## 5. Lưu frame tạm thời (in-memory, chưa có `Room.frame_id`)

```typescript
// rooms/room-frame-selection.store.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomFrameSelectionStore {
  private selections = new Map<string, string>(); // roomId -> frameId

  set(roomId: string, frameId: string) {
    this.selections.set(roomId, frameId);
  }

  get(roomId: string): string | undefined {
    return this.selections.get(roomId);
  }

  clear(roomId: string) {
    this.selections.delete(roomId);
  }
}
```

> Đăng ký làm `provider` trong `RoomsModule`, inject vào `RoomsService`. Tách thành class riêng (thay vì khai biến trực tiếp trong Service) để dễ thay thế bằng Redis sau này nếu scale nhiều instance — chỉ cần đổi nội dung bên trong class này, không đụng vào chỗ gọi.

```typescript
// rooms/rooms.service.ts (trích đoạn)
async selectFrame(roomId: string, frameId: string) {
  this.frameSelectionStore.set(roomId, frameId);
  this.eventEmitter.emit('room.frame_selected', { roomId, frameId });
  return { roomId, frameId };
}
```

### 5.1 Redis (Upstash free) — lưu ảnh raw tạm thời

Ảnh raw của từng participant nằm trên Redis cho tới khi host ghép xong, thay cho bảng `RoomCapture`.

**Cấu hình Upstash**

1. Vào console Upstash → tạo Redis database, chọn region gần nhất (Singapore).
2. Ở tab TCP, copy URL dạng `rediss://default:<password>@<host>.upstash.io:6379` (hai chữ `s` → ioredis tự bật TLS).
3. Thêm vào `.env`: `REDIS_URL=rediss://default:...`
4. `npm install ioredis` — dùng ioredis (TCP) để lưu thẳng `Buffer`, không cần base64 (đỡ tốn thêm ~33% dung lượng).

```typescript
// redis/redis.module.ts
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: 3 }),
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
```

```typescript
// rooms/room-capture.store.ts
@Injectable()
export class RoomCaptureStore {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  /** room:{roomCode}:{username}:{slotIndex} */
  key(roomCode: string, username: string, slotIndex: number) {
    return `room:${roomCode}:${encodeURIComponent(username)}:${slotIndex}`; // encode để username có ':' cũng không vỡ key
  }

  save(roomCode: string, username: string, slotIndex: number, buf: Buffer, ttlSeconds: number) {
    return this.redis.set(this.key(roomCode, username, slotIndex), buf, 'EX', ttlSeconds);
  }

  get(roomCode: string, username: string, slotIndex: number): Promise<Buffer | null> {
    return this.redis.getBuffer(this.key(roomCode, username, slotIndex));
  }

  async deleteMany(keys: string[]) {
    if (keys.length) await this.redis.del(...keys);
  }
}
```

> Đăng ký `RedisModule` ở `AppModule`, `RoomCaptureStore` làm provider trong `RoomsModule`.

**Quy ước và giới hạn**

- **Key**: `room:{roomCode}:{username}:{slotIndex}`. Host không cần `SCAN`/`KEYS` — đã có danh sách participant (username + slot) nên tự dựng key (tiết kiệm lệnh).
- **TTL** = hạn của phòng (`expires_at`), nhưng chặn tối thiểu 600s để host kịp ghép nếu phòng sắp hết hạn lúc đang chụp.
- **Xóa sớm**: sau khi `compose` thành công, xóa N key để giải phóng bộ nhớ (nếu lỗi thì TTL tự dọn).
- **Kích thước ảnh**: giữ mỗi ảnh raw **dưới ~800KB** (client gửi JPEG quality ~0.85, rộng tối đa ~1280px, thường 150–400KB). Tài liệu Upstash đang ghi giới hạn request là 1MB ở một số trang và 10MB ở trang khác — lấy 1MB làm mốc an toàn.
- **Gói free** (tại thời điểm viết spec): 256MB dữ liệu, 500K lệnh/tháng, 1 database/tài khoản. Mỗi phòng 4 người ≈ 12 lệnh (4 `SET` + 4 `GET` + 4 `DEL`) → dư sức cho quy mô đồ án. Kiểm tra lại trang pricing của Upstash trước khi demo.
- **Bảo mật**: chỉ backend giữ `REDIS_URL`; host lấy ảnh qua `GET /rooms/:id/captures/:slotIndex` (có `assertIsHost`).

---

## 6. Realtime Gateway

```typescript
// rooms/room.gateway.ts
@WebSocketGateway({ namespace: '/rooms', cors: { origin: ['http://localhost:3000', 'http://localhost:5173'] } })
export class RoomGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    try {
      client.data.user = this.jwtService.verify(token);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(`room:${roomId}`);
  }

  @OnEvent('room.frame_selected')
  onFrameSelected(payload: { roomId: string; frameId: string }) {
    this.server.to(`room:${payload.roomId}`).emit('room:frame_selected', payload);
  }

  @OnEvent('room.participant_joined')
  onParticipantJoined(payload: { roomId: string; participant: any }) {
    this.server.to(`room:${payload.roomId}`).emit('room:participant_joined', payload.participant);
  }

  @OnEvent('room.countdown_started')
  onCountdownStarted(payload: { roomId: string; countdownSeconds: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:countdown_started', payload);
  }

  /** Mọi client nhận tín hiệu "chụp" CÙNG MỘT LÚC, đồng bộ qua timestamp tuyệt đối */
  @OnEvent('room.capture_trigger')
  onCaptureTrigger(payload: { roomId: string; triggerAt: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:capture_trigger', payload);
  }

  @OnEvent('room.participant_captured')
  onParticipantCaptured(payload: { roomId: string; slotIndex: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:participant_captured', payload);
  }

  /** Đủ N người đã chụp → báo cho cả phòng; chỉ client của HOST xử lý (tải ảnh raw + ghép + gửi /compose) */
  @OnEvent('room.all_captured')
  onAllCaptured(payload: { roomId: string; slots: { slotIndex: number; username: string }[] }) {
    this.server.to(`room:${payload.roomId}`).emit('room:all_captured', payload);
  }

  @OnEvent('room.composed_ready')
  onComposedReady(payload: { roomId: string; photo: any; sessionResult: any }) {
    this.server.to(`room:${payload.roomId}`).emit('room:composed_ready', payload);
  }
}
```

> **Vì sao dùng `triggerAt` (timestamp tuyệt đối) thay vì chụp ngay khi nhận event**: nếu client chụp ngay lúc nhận `'room:capture_trigger'`, N người sẽ chụp lệch nhau vài trăm ms do độ trễ mạng khác nhau. Gửi kèm `triggerAt = Date.now() + 1000`, mỗi client tự `setTimeout` đến đúng mốc đó — đồng bộ chính xác hơn.

---

## 7. Service — luồng chụp, nhận ảnh ghép từ host, tạo `Session_Result`

```typescript
// rooms/rooms.service.ts
async startCountdown(roomId: string) {
  const room = await this.roomRepository.findOne({ where: { id: roomId } });
  await this.roomRepository.update(roomId, { status: RoomStatus.COUNTDOWN });

  this.eventEmitter.emit('room.countdown_started', { roomId, countdownSeconds: room.countdown_seconds });

  setTimeout(() => {
    const triggerAt = Date.now() + 1000; // buffer 1s để chắc chắn mọi client đã nhận event
    this.roomRepository.update(roomId, { status: RoomStatus.CAPTURING });
    this.eventEmitter.emit('room.capture_trigger', { roomId, triggerAt });
  }, room.countdown_seconds * 1000);
}

async submitCapture(roomId: string, accountId: string, file: Buffer) {
  const room = await this.roomRepository.findOne({ where: { id: roomId } });
  const participant = await this.participantRepository.findOne({
    where: { room_id: roomId, account_id: accountId },
    relations: ['account'],
  });
  if (!participant) throw new ForbiddenException('Bạn không ở trong phòng này');

  // TTL = hạn của phòng, nhưng không thấp hơn 10 phút để host kịp ghép
  const ttlSeconds = Math.max(600, Math.ceil((room.expires_at.getTime() - Date.now()) / 1000));
  await this.captureStore.save(
    room.room_code,
    participant.account.username,
    participant.slot_index,
    file,
    ttlSeconds,
  );

  await this.participantRepository.update(participant.id, { status: ParticipantStatus.CAPTURED });
  this.eventEmitter.emit('room.participant_captured', { roomId, slotIndex: participant.slot_index });

  const captured = await this.participantRepository.find({
    where: { room_id: roomId, status: ParticipantStatus.CAPTURED },
    relations: ['account'],
    order: { slot_index: 'ASC' },
  });
  if (captured.length >= room.max_participants) {
    // Server KHÔNG ghép — chỉ báo để host tự lấy ảnh trên Redis
    this.eventEmitter.emit('room.all_captured', {
      roomId,
      slots: captured.map((p) => ({ slotIndex: p.slot_index, username: p.account.username })),
    });
  }
}

async getCaptureBuffer(roomId: string, slotIndex: number): Promise<Buffer> {
  const room = await this.roomRepository.findOne({ where: { id: roomId } });
  const participant = await this.participantRepository.findOne({
    where: { room_id: roomId, slot_index: slotIndex },
    relations: ['account'],
  });
  const buf =
    participant &&
    (await this.captureStore.get(room.room_code, participant.account.username, slotIndex));
  if (!buf) throw new GoneException('Ảnh raw đã hết hạn hoặc chưa có, cần chụp lại');
  return buf;
}

/** Host gửi 2 file đã ghép ở client → lưu StorageService, tạo Photo + Session_Result */
async finalizeRoomPhoto(roomId: string, accountId: string, original: Buffer, processed: Buffer) {
  await this.assertIsHost(roomId, accountId);

  // Idempotent: host gửi 2 lần thì trả kết quả cũ, không tạo Photo trùng
  const existing = await this.sessionResultRepository.findOne({ where: { room_id: roomId } });
  if (existing) {
    const photo = await this.photoRepository.findOne({ where: { id: existing.photo_id } });
    return { photo, sessionResult: existing };
  }

  const room = await this.roomRepository.findOne({ where: { id: roomId } });
  const frameId = this.frameSelectionStore.get(roomId);
  if (!frameId) throw new BadRequestException('Phòng chưa chọn frame');

  const participants = await this.participantRepository.find({
    where: { room_id: roomId, status: ParticipantStatus.CAPTURED },
    relations: ['account'],
  });
  if (participants.length < room.max_participants) {
    throw new BadRequestException('Chưa đủ ảnh từ các slot');
  }

  const [originalUrl, processedUrl] = await Promise.all([
    this.storageService.uploadFile('photos/group', original, 'png'),
    this.storageService.uploadFile('photos/group', processed, 'png'),
  ]);

  const photo = await this.photoRepository.save({
    account_id: room.host_account_id, // chỉ host sở hữu, dù nội dung có nhiều người
    frame_id: frameId,
    media_type: MediaType.PHOTO,
    original_file_url: originalUrl,
    processed_file_url: processedUrl,
    status: PhotoStatus.COMPLETED,
    share_token: uuid(),
  });

  const sessionResult = await this.sessionResultRepository.save({
    account_id: room.host_account_id,
    session_type: SessionResultType.GROUP,
    room_id: room.id,
    photo_id: photo.id,
    status: SessionResultStatus.PARTIAL, // chờ recording/gift nếu luồng có các bước đó
  });

  await this.roomRepository.update(roomId, {
    status: RoomStatus.POST_PRODUCTION,
    completed_at: new Date(),
  });
  this.frameSelectionStore.clear(roomId);

  // Giải phóng Redis (nếu lỗi thì TTL tự dọn)
  await this.captureStore.deleteMany(
    participants.map((p) => this.captureStore.key(room.room_code, p.account.username, p.slot_index)),
  );

  this.eventEmitter.emit('room.composed_ready', { roomId, photo, sessionResult });
  return { photo, sessionResult };
}
```

### Luồng ghép ảnh phía client (chỉ host)

Ghép đúng 2 lớp như luồng chụp đơn:
1. **`original`**: N ảnh raw đặt đúng vị trí slot, **chưa** có frame đè lên — giữ lại để sau này đổi frame khác mà không cần chụp lại.
2. **`processed`**: lấy `original`, vẽ đè ảnh frame (`frame.image_url`) lên trên cùng — đây là ảnh thật sự hiển thị/chia sẻ.

```typescript
// Frontend — chỉ client của host xử lý event này
socket.on('room:all_captured', async ({ roomId, slots }) => {
  if (!isHost) return;

  // 1. Tải N ảnh raw qua backend (blob cùng origin → canvas không bị tainted)
  const images = await Promise.all(
    slots.map(async ({ slotIndex }: { slotIndex: number }) => {
      const res = await fetch(`${API_URL}/rooms/${roomId}/captures/${slotIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 410) throw new Error('Ảnh raw đã hết hạn, cần chụp lại');
      if (!res.ok) throw new Error('Không tải được ảnh raw');
      return createImageBitmap(await res.blob());
    }),
  );

  // 2. Ghép bằng đúng hàm canvas của chụp đơn
  //    (tên/chữ ký composePhotoStrip chỉ là ví dụ — điều chỉnh theo hàm hiện có;
  //     images đã theo thứ tự slotIndex ASC, khớp frame.layout_config.slots)
  const { originalBlob, processedBlob } = await composePhotoStrip(
    images,
    frame.layout_config,
    frame.image_url,
  );

  // 3. Gửi 2 file lên server
  const form = new FormData();
  form.append('original', originalBlob, 'original.png');
  form.append('processed', processedBlob, 'processed.png');
  await fetch(`${API_URL}/rooms/${roomId}/compose`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
});
```

### Lưu ý khi ghép

- **Thứ tự phải khớp slot**: server trả `slots` đã sort theo `slot_index ASC`; `images[i]` ↔ `layout_config.slots[i]`. `slot_index` phải liên tục từ `0` đến `slots.length - 1`, không có khoảng trống, nếu không ảnh sẽ ghép sai vị trí.
- **CORS / canvas tainted**: ảnh raw tải qua `fetch` → `blob` nên cùng origin, không bị tainted. Riêng ảnh **frame overlay** nếu nằm ở origin khác (R2, CDN) thì vẫn cần `crossOrigin = 'anonymous'` và server trả header CORS — giống luồng chụp đơn.
- **Chỉ host ghép** để tránh N client cùng ghép/upload trùng; `finalizeRoomPhoto` còn idempotent phòng khi host gửi 2 lần.
- **Đánh đổi**: ảnh kết quả do client sinh ra nên server không kiểm chứng được nội dung — chấp nhận được với quy mô đồ án. Quyền sở hữu vẫn được chốt ở server (`account_id = host`).
- **Host rớt mạng giữa chừng**: ảnh raw vẫn còn trên Redis đến hết TTL, host (hoặc host mới sau khi chuyển quyền) vào lại là ghép tiếp được.

---

## 8. Kiểm tra quyền khi tạo `Post` (dùng chung cho cả đơn và nhóm)

```typescript
// posts/posts.service.ts
async create(accountId: string, dto: CreatePostDto) {
  const sessionResult = await this.sessionResultRepository.findOne({
    where: { id: dto.sessionResultId },
    relations: ['photo'],
  });
  if (!sessionResult) throw new NotFoundException('Không tìm thấy kết quả chụp');

  if (sessionResult.account_id !== accountId) {
    throw new ForbiddenException('Bạn không có quyền đăng bài từ kết quả chụp này');
  }
  if (!sessionResult.photo_id) {
    throw new BadRequestException('Kết quả chụp chưa có ảnh để đăng bài');
  }

  // ... tạo Post như spec trước, lấy cover_image_url từ sessionResult.photo.processed_file_url
}
```

Logic này **không cần biết** `sessionResult.session_type` là `single` hay `group` — vì quyền đã được chuẩn hoá ngay trên `account_id` của `Session_Result`, đúng tinh thần thiết kế đã chốt.

---

## 9. Xử lý các trường hợp lỗi

| Tình huống | Cách xử lý |
|---|---|
| Participant rời phòng giữa chừng | `status = LEFT`, slot trống lại, host mời người khác hoặc tự chụp bù |
| Phòng chờ quá lâu không đủ người | Check `now > expires_at` lúc `GET /rooms/code/:code` → `status = EXPIRED` |
| Thiếu 1 slot sau khi trigger chụp | Timeout ~10s sau `capture_trigger`, cho phép chụp bù riêng slot đó (ghi đè key Redis của slot) |
| Host thoát phòng giữa chừng | Khuyến nghị: chuyển quyền host cho participant join sớm thứ 2; host mới (hoặc host cũ vào lại) lấy ảnh raw từ Redis, ghép và gọi `/compose` |
| Server restart khi phòng đang ở Bước 2-3 | Lựa chọn frame (in-memory) mất, phòng quay về yêu cầu host chọn lại |
| Redis hết TTL trước khi host ghép | `GET /captures/:slotIndex` trả `410 Gone`, yêu cầu chụp lại slot thiếu |
| Ảnh raw quá ~800KB hoặc không phải JPEG | multer từ chối; client nén lại (JPEG ~0.85, rộng ≤ 1280px) |
| Redis không kết nối được | `submitCapture` lỗi 5xx, client cho chụp/gửi lại; kiểm tra `REDIS_URL` |
| Host gọi `/compose` 2 lần | Idempotent: trả `Photo` + `Session_Result` cũ, không tạo trùng |
| `compose` gọi khi chưa `selectFrame` | Chặn bằng `BadRequestException`, không tạo `Photo` rác |

---

## 10. Package cần cài thêm

```bash
npm install livekit-server-sdk   # cấp token kết nối video
npm install ioredis              # Redis (Upstash, qua TCP) lưu ảnh raw tạm thời
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/event-emitter
```

```env
# .env — URL TCP lấy ở tab TCP của database Upstash (rediss:// có 2 chữ "s")
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
```

---

## 11. Checklist

- [ ] Tạo phòng → `room_code` unique, không trùng phòng đang active
- [ ] Host chọn frame → mọi client trong phòng nhận `room:frame_selected` ngay
- [ ] N người join đủ → mỗi người `slot_index` khác nhau, không trùng
- [ ] Người thừa cố join phòng đã đủ `max_participants` → bị từ chối rõ ràng
- [ ] Host bấm "Bắt đầu đếm ngược" → tất cả client đồng bộ cùng 1 con số
- [ ] Hết đếm ngược → tất cả chụp gần như đồng thời (chênh lệch chấp nhận được ~100-200ms)
- [ ] Participant chụp xong → ảnh JPEG nằm trong Redis đúng key `room:{roomCode}:{username}:{slotIndex}`, có TTL (`TTL <key>` > 0)
- [ ] Ảnh > ~800KB hoặc không phải JPEG → bị từ chối
- [ ] Đủ N người `CAPTURED` → client của host nhận `room:all_captured`; server **không** tự ghép
- [ ] Participant (không phải host) gọi `GET /rooms/:id/captures/:slotIndex` hoặc `POST /rooms/:id/compose` → `403`
- [ ] Host tải đủ N ảnh, ghép canvas, `POST /compose` → tạo `Photo` + `Session_Result`, `account_id` = đúng host
- [ ] Host gọi `/compose` 2 lần → không tạo `Photo` trùng
- [ ] Sau `/compose` thành công → các key Redis của phòng đã bị xóa
- [ ] Để key hết TTL rồi gọi `GET /captures/:slotIndex` → `410 Gone`
- [ ] `Session_Result.status = 'partial'` ngay sau khi có `photo_id`, chưa có `recording_id`/`gift_id`
- [ ] Participant (không phải host) gọi `POST /posts` với `sessionResultId` của phòng đó → bị từ chối `403`
- [ ] Host gọi `POST /posts` → thành công, `Post.account_id` = host
- [ ] Test với 2 thiết bị thật (không chỉ 2 tab cùng máy) để kiểm tra độ trễ mạng thực tế
