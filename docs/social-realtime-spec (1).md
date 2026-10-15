# Spec — Social Feature + Realtime (Feed cộng đồng sau khi chụp photobooth)

## Bối cảnh

Sau khi khách chụp xong (đã có `CaptureSession` + `Photo`), khách có thể đăng bài chia sẻ lên feed cộng đồng — kèm caption, tag style. Người khác xem feed **realtime** (bài mới tự hiện ra), bình luận/trả lời/like cũng cập nhật realtime không cần F5 trang — đúng theo mockup "Cộng đồng đánh giá & Cảm hứng" bạn gửi.

---

## 1. Cài đặt package

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/event-emitter
```

---

## 2. Entities

### `Post`

```typescript
// posts/entities/post.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { CaptureSession } from '../../sessions/entities/capture-session.entity';

export enum PostStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  @ManyToOne(() => CaptureSession)
  @JoinColumn({ name: 'session_id' })
  session: SessionResult;

  @Column()
  session_id: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ type: 'jsonb', nullable: true })
  style_tags: string[] | null;

  @Column()
  cover_image_url: string;

  @Column({ default: 0 })
  likes_count: number;

  @Column({ default: 0 })
  comments_count: number;

  @Column({ default: 0 })
  views_count: number;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.PUBLISHED })
  status: PostStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

### `Comment` (hỗ trợ reply lồng nhau, đúng UI "Thảo luận & Hỏi đáp")

```typescript
// comments/entities/comment.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  post_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  /** null = comment gốc, có giá trị = reply của comment khác */
  @Column({ nullable: true })
  parent_comment_id: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  likes_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

### `PostLike` (chặn like trùng)

```typescript
// posts/entities/post-like.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

@Entity('post_like')
@Unique(['post_id', 'account_id']) // 1 account chỉ like 1 lần / 1 post
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  post_id: string;

  @Column()
  account_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

---

## 3. Event-Driven — tách biệt nghiệp vụ và realtime

### Đăng ký `EventEmitterModule` global

```typescript
// app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // ... các module khác
  ],
})
export class AppModule {}
```

### `PostsService` — phát event sau khi lưu DB, không biết gì về WebSocket

```typescript
// posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike) private readonly postLikeRepository: Repository<PostLike>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: Partial<Post>) {
    const post = this.postRepository.create(data);
    const saved = await this.postRepository.save(post);

    this.eventEmitter.emit('post.created', saved); // chỉ phát tín hiệu, không quan tâm ai lắng nghe
    return saved;
  }

  async toggleLike(postId: string, accountId: string) {
    const existing = await this.postLikeRepository.findOne({
      where: { post_id: postId, account_id: accountId },
    });

    if (existing) {
      await this.postLikeRepository.delete(existing.id);
      await this.postRepository.decrement({ id: postId }, 'likes_count', 1);
    } else {
      await this.postLikeRepository.save({ post_id: postId, account_id: accountId });
      await this.postRepository.increment({ id: postId }, 'likes_count', 1);
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    this.eventEmitter.emit('post.liked', { postId, likesCount: post!.likes_count });
    return post;
  }

  findFeed(page = 1, limit = 10) {
    return this.postRepository.find({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['account'],
    });
  }
}
```

### `CommentsService` — tương tự, phát event riêng

```typescript
// comments/comments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: Partial<Comment>) {
    const comment = this.commentRepository.create(data);
    const saved = await this.commentRepository.save(comment);
    await this.postRepository.increment({ id: data.post_id }, 'comments_count', 1);

    this.eventEmitter.emit('comment.created', saved);
    return saved;
  }

  findByPost(postId: string) {
    return this.commentRepository.find({
      where: { post_id: postId },
      order: { created_at: 'ASC' },
      relations: ['account'],
    });
  }
}
```

---

## 4. `SocialGateway` — lớp realtime duy nhất, lắng nghe event và đẩy ra client

```typescript
// social/social.gateway.ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/social',
  cors: { origin: ['http://localhost:3000', 'http://localhost:5173'] }, // giống CORS đã cấu hình cho R2
})
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(SocialGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    client.join('feed'); // mặc định vào room "feed" để nhận bài đăng mới
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // Client báo đang xem chi tiết 1 post cụ thể -> join room riêng để nhận comment/like realtime
  @SubscribeMessage('join:post')
  handleJoinPost(@MessageBody() postId: string, @ConnectedSocket() client: Socket) {
    client.join(`post:${postId}`);
  }

  @SubscribeMessage('leave:post')
  handleLeavePost(@MessageBody() postId: string, @ConnectedSocket() client: Socket) {
    client.leave(`post:${postId}`);
  }

  // ==== Lắng nghe event nội bộ từ Service, không cần Service biết gì về socket ====

  @OnEvent('post.created')
  handlePostCreated(post: any) {
    this.server.to('feed').emit('post:created', post);
  }

  @OnEvent('post.liked')
  handlePostLiked(payload: { postId: string; likesCount: number }) {
    this.server.to('feed').emit('post:liked', payload);
    this.server.to(`post:${payload.postId}`).emit('post:liked', payload);
  }

  @OnEvent('comment.created')
  handleCommentCreated(comment: any) {
    this.server.to(`post:${comment.post_id}`).emit('comment:created', comment);
  }
}
```

### `SocialModule`

```typescript
// social/social.module.ts
import { Module } from '@nestjs/common';
import { SocialGateway } from './social.gateway';

@Module({
  providers: [SocialGateway],
})
export class SocialModule {}
```

> Import `SocialModule` vào `AppModule`. `PostsModule`/`CommentsModule` **không cần import `SocialModule`** — nhờ `EventEmitter2` toàn cục, 2 bên hoàn toàn độc lập với nhau.

---

## 5. REST API cần có

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/posts` | Tạo bài đăng từ 1 `CaptureSession` đã chụp xong |
| `GET` | `/posts` | Lấy feed (phân trang) |
| `GET` | `/posts/:id` | Chi tiết 1 bài (dùng để tăng `views_count`) |
| `POST` | `/posts/:id/like` | Toggle like/unlike |
| `POST` | `/comments` | Tạo comment hoặc reply (`parent_comment_id` optional) |
| `GET` | `/posts/:id/comments` | Danh sách comment của 1 bài |

```typescript
// posts/posts.controller.ts (rút gọn phần chính)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard) // Account đã đăng nhập (role bất kỳ: admin/staff/customer)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePostDto) {
    return this.postsService.create({ ...dto, account_id: user.id });
  }

  @Get()
  findFeed(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.postsService.findFeed(+page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.postsService.toggleLike(id, user.id);
  }
}
```

> **Khách vãng lai (`Customer.is_guest = true`, không có `account_id`) sẽ không đăng bài/comment/like được** — vì social feature giờ yêu cầu đăng nhập thật qua `Account`, không còn dùng `session_token` kiểu khách vãng lai. Nếu khách vãng lai vào trang Feed, chỉ cho phép xem (`GET /posts`, `GET /posts/:id/comments`), còn action ghi (đăng bài/like/comment) hiển thị nút "Đăng nhập để tham gia".

---

## 6. Client kết nối WebSocket (Frontend)

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000/social', {
  transports: ['websocket'],
});

// Feed page — nhận bài đăng mới realtime
socket.on('post:created', (post) => {
  setFeed((prev) => [post, ...prev]);
});

socket.on('post:liked', ({ postId, likesCount }) => {
  setFeed((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: likesCount } : p)));
});

// Post detail page — vào room riêng để nhận comment realtime
function enterPostDetail(postId: string) {
  socket.emit('join:post', postId);
  socket.on('comment:created', (comment) => {
    setComments((prev) => [...prev, comment]);
  });
}

function leavePostDetail(postId: string) {
  socket.emit('leave:post', postId);
}
```

---

## 7. Xác thực kết nối WebSocket (bảo mật)

Nếu muốn chỉ khách đã có `session`/token hợp lệ mới kết nối được (tránh spam/bot), verify token ngay trong `handleConnection`:

```typescript
handleConnection(client: Socket) {
  const token = client.handshake.auth?.token || client.handshake.query?.token;
  try {
    const payload = this.jwtService.verify(token as string);
    client.data.user = payload;
  } catch {
    client.disconnect(); // từ chối kết nối nếu token sai/thiếu
    return;
  }
  client.join('feed');
}
```

> Với photobooth, khách vãng lai (`is_guest = true`) có thể không có JWT thật — có thể nới lỏng: cho phép kết nối ẩn danh để xem feed (`GET`), nhưng bắt buộc xác thực khi gửi comment/like (check ở REST API bằng `JwtAuthGuard` như bình thường, không cần chặn ở tầng socket).

---

## 8. Lưu ý khi scale (ghi chú cho phần "hướng phát triển" trong báo cáo, không bắt buộc làm ngay)

Nếu sau này deploy nhiều instance backend (load balancer), Socket.io mặc định **không tự đồng bộ giữa các instance** — client A kết nối vào server 1 sẽ không nhận được event phát từ server 2. Giải pháp chuẩn: dùng **Redis Adapter** cho Socket.io (`@socket.io/redis-adapter`) để các instance chia sẻ chung message bus. Với quy mô đồ án (1 instance duy nhất khi demo), **chưa cần làm phần này** — chỉ cần biết để trả lời nếu hội đồng hỏi về khả năng mở rộng.

---

## 9. Checklist

- [ ] Mở 2 tab trình duyệt cùng vào trang Feed → tạo bài đăng ở tab 1 → tab 2 tự động thấy bài mới xuất hiện, không cần F5
- [ ] Like ở tab 1 → số lượt like ở tab 2 cập nhật ngay
- [ ] Mở chi tiết 1 bài ở 2 tab → comment ở tab 1 → tab 2 thấy comment mới ngay lập tức
- [ ] Đóng tab (disconnect) → server không lỗi, log ra đúng `Client disconnected`
- [ ] Test với network chậm (throttle DevTools) → không bị duplicate event, không bị mất event
- [ ] `comments_count`/`likes_count` trên `Post` luôn khớp với số lượng thật trong bảng `Comment`/`PostLike`
