# Spec — Hệ thống Thông báo (Notification)

## 1. Bối cảnh & câu hỏi thiết kế

Thiết kế hệ thống thông báo cần trả lời 3 câu hỏi trước khi vào field:

1. **Thông báo về cái gì** (loại sự kiện)
2. **Ai nhận** (1 người hay nhiều)
3. **Đi tới đâu** (chỉ lưu DB để xem lại, hay cần đẩy realtime/push ngay lúc đó)

### Các sự kiện cần sinh thông báo (rà theo tính năng đã làm)

| Nguồn | Sự kiện | Người nhận |
|---|---|---|
| Comment | Có người bình luận vào bài của bạn | Chủ Post |
| Comment | Có người trả lời bình luận của bạn | Chủ Comment cha |
| PostLike | Có người thích bài của bạn | Chủ Post |
| PostRepost | Có người đăng lại bài của bạn | Chủ Post |
| Room | Có người tham gia phòng chụp nhóm của bạn | Host |
| Room | Host bắt đầu đếm ngược | Mọi participant trong phòng |
| Frame/Gift | Quà tặng/voucher đã sẵn sàng nhận | Chủ Session_Result |
| Admin | Thông báo hệ thống (bảo trì, khuyến mãi, feedback bị admin phản hồi) | 1 người hoặc toàn bộ account |

Vì nguồn sự kiện rất đa dạng (Comment, PostLike, PostRepost, Room...) nhưng cấu trúc thông báo cuối cùng giống nhau, nên dùng **1 bảng `Notification` chung** với field "đa hình" (polymorphic) trỏ tới đối tượng liên quan, thay vì tạo riêng từng bảng `CommentNotification`, `LikeNotification`... — đúng tinh thần tái dùng đã làm với `Session_Result` trước đó.

---

## 2. Entity `Notification`

```typescript
// notifications/entities/notification.entity.ts
export enum NotificationType {
  POST_COMMENTED = 'post_commented',
  COMMENT_REPLIED = 'comment_replied',
  POST_LIKED = 'post_liked',
  POST_REPOSTED = 'post_reposted',
  ROOM_PARTICIPANT_JOINED = 'room_participant_joined',
  ROOM_COUNTDOWN_STARTED = 'room_countdown_started',
  GIFT_READY = 'gift_ready',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ADMIN_FEEDBACK_REPLIED = 'admin_feedback_replied',
}

@Entity('notification')
@Index(['recipient_account_id', 'is_read', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Người nhận thông báo */
  @Column()
  recipient_account_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'recipient_account_id' })
  recipient: Account;

  /** Người gây ra hành động — null nếu là thông báo hệ thống (admin broadcast) */
  @Column({ nullable: true })
  actor_account_id: string | null;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'actor_account_id' })
  actor: Account | null;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  /** Nội dung hiển thị — không bắt buộc, có thể render từ type + actor ở FE,
   *  nhưng lưu sẵn để đổi logic sau không cần sửa dữ liệu cũ */
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  /** Đối tượng liên quan — đa hình, không cố định FK sang 1 bảng duy nhất */
  @Column({ nullable: true })
  entity_type: string | null; // 'post' | 'comment' | 'room' | 'gift' | null

  @Column({ nullable: true })
  entity_id: string | null;

  /** Đường dẫn FE điều hướng khi bấm vào thông báo, vd "/posts/abc-123" */
  @Column({ nullable: true })
  action_url: string | null;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

### Giải thích từng quyết định field

- **`actor_account_id` nullable**: phân biệt "ai đó đã làm gì với bạn" (có actor) và "hệ thống thông báo cho bạn" (admin broadcast, không có actor cụ thể).
- **`entity_type` + `entity_id`** thay vì nhiều cột FK (`post_id`, `comment_id`, `room_id`...): tránh bảng có hàng chục cột phần lớn để NULL, và dễ mở rộng thêm loại thông báo mới sau này mà không cần `ALTER TABLE`.
- **`action_url`** lưu sẵn thay vì để FE tự suy luận từ `type` + `entity_id`: đổi routing sau này (đổi cấu trúc URL) không cần migrate lại dữ liệu cũ, chỉ cần backend sinh đúng url mới cho thông báo mới.
- **`title`/`message`** lưu sẵn thay vì chỉ lưu `type` rồi FE tự render theo i18n: đơn giản hơn cho đồ án, và cho phép customize nội dung admin broadcast tự do (không bị gò theo template cố định).
- **Index `(recipient_account_id, is_read, created_at)`**: vì query phổ biến nhất chắc chắn là "lấy thông báo chưa đọc của tôi, mới nhất trước" — index này phục vụ đúng cả 3 điều kiện cùng lúc.

---

## 3. Kiến trúc tổng thể — tái dùng pattern Event-Driven đã có

```
Service nghiệp vụ (CommentsService, PostsService, RoomsService...)
        │ sau khi lưu DB xong
        ▼
  emit event nội bộ ('comment.created', 'post.liked'...)
        │
        ▼
NotificationListener (lắng nghe các event đó)
        │ tạo record Notification
        ▼
  emit 'notification.created'
        │
        ▼
NotificationGateway (WebSocket) → đẩy realtime cho đúng recipient
```

**Điểm quan trọng:** không để `CommentsService`/`PostsService` tự viết logic tạo Notification — tách thành 1 `NotificationListener` riêng, lắng nghe lại chính những event `post.created`, `comment.created`, `post.liked`... đã emit từ trước cho realtime feed. Nhờ vậy, thêm loại thông báo mới chỉ cần thêm 1 `@OnEvent` handler, không phải sửa code nghiệp vụ gốc ở nhiều nơi.

```typescript
// notifications/notification.listener.ts
@Injectable()
export class NotificationListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly postsService: PostsService,
  ) {}

  @OnEvent('comment.created')
  async onCommentCreated(comment: Comment) {
    const post = await this.postsService.findOne(comment.post_id);
    if (post.account_id === comment.account_id) return; // không tự thông báo cho chính mình

    await this.notificationsService.create({
      recipient_account_id: post.account_id,
      actor_account_id: comment.account_id,
      type: NotificationType.POST_COMMENTED,
      title: 'Có bình luận mới',
      message: `đã bình luận về bài viết của bạn`,
      entity_type: 'post',
      entity_id: post.id,
      action_url: `/posts/${post.id}`,
    });
  }

  @OnEvent('post.liked')
  async onPostLiked(payload: { postId: string; accountId: string; likesCount: number }) {
    // tương tự — check không tự thông báo cho chính mình, rồi tạo Notification
  }
}
```

> **Lưu ý tích hợp:** event `post.liked` hiện có trong `PostsService.toggleLike` chỉ emit `{ postId, likesCount }` — cần bổ sung `accountId` vào payload, và chỉ emit thông báo khi **like** (không phải unlike).

---

## 4. REST API

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/notifications` | Danh sách thông báo của tôi, phân trang |
| `GET` | `/notifications/unread-count` | Số lượng chưa đọc (hiển thị badge đỏ) |
| `PATCH` | `/notifications/:id/read` | Đánh dấu đã đọc 1 thông báo |
| `PATCH` | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| `DELETE` | `/notifications/:id` | Xoá 1 thông báo (tuỳ chọn, không bắt buộc) |

```typescript
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationsService.findByRecipient(user.id, +page, +limit);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
```

> Route `read-all` phải khai báo **trước** `:id/read` nếu sau này thêm route dạng `PATCH /notifications/:id` để tránh bị nhận nhầm `read-all` thành `:id`.

---

## 5. Realtime — Gateway riêng, join room theo từng account

Khác với `SocialGateway` (room feed dùng chung cho mọi người), notification phải gửi đúng 1 người, nên join theo `account_id`:

```typescript
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    try {
      const payload = this.jwtService.verify(token);
      client.join(`account:${payload.sub}`); // mỗi account 1 room riêng
    } catch {
      client.disconnect();
    }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(notification: Notification) {
    this.server.to(`account:${notification.recipient_account_id}`).emit('notification:new', notification);
  }
}
```

---

## 6. Vấn đề cần quyết định thêm

- **`NotificationPreference`** (cho phép account tự bật/tắt từng loại thông báo, vd tắt thông báo like nhưng giữ thông báo comment): với đồ án có thể bỏ qua — mặc định tất cả bật.
- **Push notification khi tắt web/app** (Web Push, FCM): tầng bổ sung khác hẳn, cần service worker + VAPID keys, khá tốn công cho 1 đồ án. Khuyên để WebSocket + badge trong app là đủ, nêu push notification ở phần "hướng phát triển" trong báo cáo.
- **Giới hạn số lượng lưu trữ**: có nên tự xoá thông báo cũ hơn N ngày (cron job) để bảng không phình to? Không bắt buộc, nhưng nên biết để trả lời nếu hội đồng hỏi về khả năng mở rộng.

---

## 7. Checklist

- [ ] Có người comment vào bài của A → A nhận thông báo realtime + badge tăng, không cần F5
- [ ] A tự comment/like bài của chính mình → **không** sinh thông báo
- [ ] Bấm vào thông báo → điều hướng đúng `action_url`, thông báo chuyển sang đã đọc
- [ ] `read-all` → badge về 0 ở mọi tab đang mở
- [ ] Unlike rồi like lại không sinh thông báo trùng liên tục (cân nhắc chống spam theo cặp actor + post)
- [ ] Token sai/thiếu khi kết nối `/notifications` → bị `disconnect()`
