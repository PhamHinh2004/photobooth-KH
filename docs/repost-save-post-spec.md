# Spec — Đăng lại (Repost) + Lưu bài viết (Save) cho Post

## Bối cảnh

Dựa trên `Post`/`Account`/`PostLike`/`Comment` đã có. Thêm 2 tính năng độc lập nhau:
1. **Đăng lại (Repost)** kiểu TikTok — không copy nội dung thành bài mới, chỉ tạo 1 tham chiếu "account X đã đăng lại post Y", kèm `repost_count` hiển thị trên bài gốc.
2. **Lưu bài viết (Save)** — danh sách riêng tư của từng account, không public, không ảnh hưởng `likes_count`/`comments_count` của bài gốc.

Cả hai đều theo đúng pattern đã dùng cho `PostLike`: 1 bảng trung gian + `Unique` constraint để chặn trùng, cộng dồn số liệu bằng `increment`/`decrement`, phát event qua `EventEmitter2` để `SocialGateway` (hoặc `RoomGateway`/gateway xã hội đã có) đẩy realtime.

---

## 1. Vì sao Repost không nhân bản `Post` mới

Nhìn theo đúng cách TikTok vận hành: repost **không tạo nội dung mới**, nó chỉ là 1 "dấu" gắn vào bài gốc, hiển thị trên trang cá nhân người repost dưới dạng "đã đăng lại", và tăng độ phủ cho bài gốc. Nếu tạo `Post` mới (copy `caption`, `cover_image_url`...), sẽ phát sinh vấn đề: sửa/xoá bài gốc không đồng bộ sang bản copy, rating/comment bị tách rời khỏi bài gốc dù nội dung là một. Dùng 1 bảng tham chiếu tránh toàn bộ các vấn đề này.

---

## 2. Entity `PostRepost`

```typescript
// posts/entities/post-repost.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from './post.entity';

@Entity('post_repost')
@Unique(['post_id', 'account_id']) // 1 account chỉ repost 1 lần / 1 bài, bấm lại = un-repost
export class PostRepost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  post_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  /** Repost kèm lời bình ngắn, kiểu "quote repost" — optional, để trống vẫn repost được */
  @Column({ type: 'text', nullable: true })
  quote_caption: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

### Thêm `repost_count` vào `Post`

```sql
ALTER TABLE "post" ADD COLUMN "repost_count" integer NOT NULL DEFAULT 0;
```

```typescript
// posts/entities/post.entity.ts (bổ sung)
@Column({ default: 0 })
repost_count: number;
```

---

## 3. Entity `SavedPost` — "storage" riêng cho từng account

Đúng ý bạn — đây chính là bảng trung gian nhiều-nhiều giữa `Account` và `Post`, đóng vai trò "kho lưu cá nhân". Không cần tạo hẳn 1 service storage file riêng (khác với `StorageService` dùng cho R2) — đây thuần là quan hệ dữ liệu, không liên quan đến lưu trữ file.

```typescript
// posts/entities/saved-post.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from './post.entity';

@Entity('saved_post')
@Unique(['post_id', 'account_id']) // 1 account chỉ lưu 1 bài 1 lần
export class SavedPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  post_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

> **Không cần `saves_count` public trên `Post`** — vì đây là hành động riêng tư (giống "bookmark"), không phải tín hiệu xã hội như like/repost. Nếu sau này bạn muốn dùng số lượt lưu để xếp hạng nội dung nội bộ (admin xem), có thể thêm cột đếm nhưng **không hiển thị ra UI công khai**, tương tự Instagram không public số lượt save.

---

## 4. DTO

```typescript
// posts/dto/repost.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RepostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  quoteCaption?: string;
}
```

---

## 5. Service

```typescript
// posts/posts.service.ts (bổ sung)

async toggleRepost(postId: string, accountId: string, dto: RepostDto) {
  const existing = await this.postRepostRepository.findOne({
    where: { post_id: postId, account_id: accountId },
  });

  if (existing) {
    await this.postRepostRepository.delete(existing.id);
    await this.postRepository.decrement({ id: postId }, 'repost_count', 1);
    this.eventEmitter.emit('post.unreposted', { postId, accountId });
    return { reposted: false };
  }

  await this.postRepostRepository.save({
    post_id: postId,
    account_id: accountId,
    quote_caption: dto.quoteCaption ?? null,
  });
  await this.postRepository.increment({ id: postId }, 'repost_count', 1);

  const post = await this.postRepository.findOne({ where: { id: postId } });
  this.eventEmitter.emit('post.reposted', { postId, repostCount: post!.repost_count, accountId });
  return { reposted: true };
}

async toggleSave(postId: string, accountId: string) {
  const existing = await this.savedPostRepository.findOne({
    where: { post_id: postId, account_id: accountId },
  });

  if (existing) {
    await this.savedPostRepository.delete(existing.id);
    return { saved: false };
  }

  await this.savedPostRepository.save({ post_id: postId, account_id: accountId });
  return { saved: true };
  // Không emit realtime ra ngoài — đây là hành động riêng tư, chỉ chính account đó cần biết kết quả
}

/** Trang cá nhân — danh sách bài account này đã đăng lại */
findMyReposts(accountId: string, page = 1, limit = 10) {
  return this.postRepostRepository.find({
    where: { account_id: accountId },
    order: { created_at: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
    relations: ['post', 'post.account'],
  });
}

/** "Kho lưu" cá nhân — chỉ chính account đó xem được */
findMySavedPosts(accountId: string, page = 1, limit = 10) {
  return this.savedPostRepository.find({
    where: { account_id: accountId },
    order: { created_at: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
    relations: ['post', 'post.account'],
  });
}
```

---

## 6. Controller

```typescript
// posts/posts.controller.ts (bổ sung)

@UseGuards(JwtAuthGuard)
@Post(':id/repost')
toggleRepost(
  @Param('id') postId: string,
  @CurrentUser() user: { id: string },
  @Body() dto: RepostDto,
) {
  return this.postsService.toggleRepost(postId, user.id, dto);
}

@UseGuards(JwtAuthGuard)
@Post(':id/save')
toggleSave(@Param('id') postId: string, @CurrentUser() user: { id: string }) {
  return this.postsService.toggleSave(postId, user.id);
}

@UseGuards(JwtAuthGuard)
@Get('me/reposts')
getMyReposts(
  @CurrentUser() user: { id: string },
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.postsService.findMyReposts(user.id, +page, +limit);
}

@UseGuards(JwtAuthGuard)
@Get('me/saved')
getMySavedPosts(
  @CurrentUser() user: { id: string },
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.postsService.findMySavedPosts(user.id, +page, +limit);
}
```

> Đặt `GET /posts/me/reposts` và `GET /posts/me/saved` **trước** route `GET /posts/:id` trong file Controller (nếu bạn khai báo theo thứ tự tuần tự) — NestJS match route theo thứ tự khai báo, nếu `:id` đứng trước, `me` sẽ bị hiểu nhầm thành 1 giá trị `id`, gây lỗi `404`/sai dữ liệu.

---

## 7. Realtime — mở rộng Gateway đã có

```typescript
// social/social.gateway.ts (bổ sung)

@OnEvent('post.reposted')
handlePostReposted(payload: { postId: string; repostCount: number; accountId: string }) {
  this.server.to('feed').emit('post:reposted', payload);
  this.server.to(`post:${payload.postId}`).emit('post:reposted', payload);
}

@OnEvent('post.unreposted')
handlePostUnreposted(payload: { postId: string; accountId: string }) {
  this.server.to('feed').emit('post:unreposted', payload);
}
```

> **`toggleSave` không emit event ra `SocialGateway`** — vì đây là hành động chỉ ảnh hưởng chính người thao tác (giống thao tác cá nhân, không phải tín hiệu cộng đồng cần broadcast). Client chỉ cần cập nhật UI cục bộ (optimistic update) dựa trên response của chính request đó.

---

## 8. Module — cập nhật `PostsModule`

```typescript
// posts/posts.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike, PostRepost, SavedPost])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

---

## 9. Frontend — ý tưởng UI nhanh

```tsx
function RepostButton({ postId, initialCount, initialReposted }: RepostButtonProps) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);

  async function handleClick() {
    setReposted((v) => !v); // optimistic update
    setCount((c) => (reposted ? c - 1 : c + 1));
    await fetch(`/api/posts/${postId}/repost`, { method: 'POST' });
  }

  return (
    <button onClick={handleClick} className={reposted ? 'text-green-500' : ''}>
      🔁 {count}
    </button>
  );
}

function SaveButton({ postId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  async function handleClick() {
    setSaved((v) => !v);
    await fetch(`/api/posts/${postId}/save`, { method: 'POST' });
  }

  return <button onClick={handleClick}>{saved ? '🔖 Đã lưu' : '🔖 Lưu'}</button>;
}
```

Trang "Kho lưu của tôi" (`/me/saved`) và "Bài đã đăng lại" (`/me/reposts`) gọi 2 API `GET` tương ứng, hiển thị dạng list/grid giống `PostCard` đã có ở trang Feed.

---

## 10. Checklist

- [ ] Repost 1 bài → `repost_count` tăng đúng 1, record `PostRepost` được tạo
- [ ] Repost lại lần 2 cùng account cùng bài → tự động **un-repost** (xoá record, `repost_count` giảm 1), không tạo bản ghi trùng
- [ ] Repost kèm `quoteCaption` → lưu đúng, để trống vẫn repost bình thường
- [ ] Save 1 bài → record `SavedPost` được tạo, không ảnh hưởng `likes_count`/`comments_count`/`repost_count`
- [ ] Save lại lần 2 → tự động bỏ lưu (unsave)
- [ ] `GET /posts/me/saved` chỉ trả về bài **của chính account đang đăng nhập**, không lộ kho lưu của người khác
- [ ] Xoá `Post` gốc → `PostRepost`/`SavedPost` liên quan tự xoá theo (nhờ `onDelete: 'CASCADE'`), không để lại bản ghi mồ côi
- [ ] Mở 2 tab Feed → repost ở tab 1 → `repost_count` ở tab 2 cập nhật realtime ngay
- [ ] Save ở tab 1 → tab 2 **không** nhận event gì (đúng vì đây là hành động riêng tư)
