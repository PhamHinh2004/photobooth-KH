# Spec — Rating khi đăng bài + Tổng hợp Rating trung bình cho Frame

## Bối cảnh

Theo ERD hiện tại: `Post.rating` (int)— là điểm khách tự chấm cho **frame đã dùng** khi đăng bài chia sẻ. `Frame.rating` (double) cũng đã có sẵn — nhưng đây phải là **giá trị tổng hợp (trung bình cộng)** từ toàn bộ `Post.rating` liên quan đến frame đó, không phải nhập tay.



---


```typescript
// frames/entities/frame.entity.ts (bổ sung)
@Column({ type: 'double precision', default: 0 })
rating: number;

```

---

## 2. Cập nhật `Post` — ràng buộc `rating`

```typescript
// posts/entities/post.entity.ts (bổ sung)
@Column({ type: 'double precision', nullable: true })
rating: number | null; // null nếu khách không chấm điểm khi đăng bài
```

> Để `nullable`, vì có thể có bài đăng không kèm đánh giá frame (chỉ chia sẻ ảnh đơn thuần). Nếu nghiệp vụ của bạn **bắt buộc** phải đánh giá mỗi khi đăng bài, đổi lại `NOT NULL` và validate ở DTO.

### Ràng buộc giá trị 1-5 ở tầng DB (an toàn hơn chỉ validate ở code)

```sql
ALTER TABLE "post" ADD CONSTRAINT "chk_post_rating" CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
```

---

## 3. DTO tạo bài — nhận `rating`

```typescript
// posts/dto/create-post.dto.ts
import { IsUUID, IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  sessionId: string; // hoặc photoId, tuỳ luồng đã chốt trước đó

  @IsString()
  caption: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
```

> **Không nhận `frameId` từ client** — luôn suy ra từ `session`/`photo` đã chụp (như đã thống nhất ở spec trước), tránh khách giả mạo đánh giá cho frame họ chưa từng dùng.

---

## 4. Service — tạo bài kèm cập nhật `Frame.rating` (transaction)

```typescript
// posts/posts.service.ts
async create(accountId: string, dto: CreatePostDto) {
  const session = await this.sessionRepository.findOne({
    where: { id: dto.sessionId },
    relations: ['photo'],
  });
  if (!session) throw new NotFoundException('Không tìm thấy lượt chụp');
  if (session.photo?.account_id !== accountId) {
    throw new ForbiddenException('Bạn không phải chủ lượt chụp này');
  }

  const frameId = session.photo.frame_id;
  if (dto.rating && !frameId) {
    throw new BadRequestException('Lượt chụp này không dùng frame nên không thể đánh giá');
  }

  return this.dataSource.transaction(async (manager) => {
    const post = await manager.save(
      manager.create(Post, {
        account_id: accountId,
        session_id: session.id,
        frame_id: frameId,
        caption: dto.caption,
        style_tags: dto.styleTags,
        rating: dto.rating ?? null,
        cover_image_url: session.photo.processed_file_url,
      }),
    );

    if (frameId && dto.rating) {
      await this.applyRatingToFrame(manager, frameId, dto.rating);
    }

    this.eventEmitter.emit('post.created', post); // emit sau khi chắc chắn transaction thành công
    return post;
  });
}
```

### Hàm cộng dồn rating — không cần quét lại toàn bộ bảng

```typescript
private async applyRatingToFrame(manager: EntityManager, frameId: string, newRating: number) {
  // Công thức: rating_mới = (rating_cũ * count_cũ + rating_vừa_nhận) / (count_cũ + 1)
  await manager.query(
    `UPDATE frame
        SET rating = ((rating * rating_count) + $2) / (rating_count + 1),
            rating_count = rating_count + 1
      WHERE id = $1`,
    [frameId, newRating],
  );
}
```

> Dùng câu lệnh SQL tính trực tiếp trong `UPDATE` (không đọc ra rồi tính ở code) để tránh **race condition** — nếu 2 khách cùng đánh giá 1 frame gần như đồng thời, tính ở code (đọc → cộng → ghi) có thể bị mất 1 lượt cập nhật do đọc dữ liệu cũ. Tính thẳng trong câu SQL đảm bảo Postgres tự xử lý tuần tự đúng.

---

## 5. Xử lý khi bài bị xoá/ẩn — trừ lại rating tương ứng

Nếu sau này có tính năng xoá bài hoặc ẩn bài vi phạm, cần trừ lại đúng phần đã cộng, tránh `Frame.rating` bị sai lệch dần theo thời gian:

```typescript
private async revertRatingFromFrame(manager: EntityManager, frameId: string, oldRating: number) {
  await manager.query(
    `UPDATE frame
        SET rating = CASE
                        WHEN rating_count <= 1 THEN 0
                        ELSE ((rating * rating_count) - $2) / (rating_count - 1)
                      END,
            rating_count = GREATEST(rating_count - 1, 0)
      WHERE id = $1`,
    [frameId, oldRating],
  );
}
```

Gọi hàm này trong cùng transaction với thao tác xoá/ẩn `Post` (nếu `post.rating IS NOT NULL`).

---

## 6. API sort/filter Frame theo rating

### `GET /frames?sortBy=rating&sortOrder=desc`

```typescript
// frames/dto/get-frames-query.dto.ts
export class GetFramesQueryDto {
  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsEnum(['single', 'group', 'both'])
  sessionType?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(5)
  minRating?: number; // lọc "chỉ hiện frame từ 4 sao trở lên"

  @IsOptional() @IsIn(['rating', 'usage_count', 'created_at'])
  sortBy?: string = 'created_at';

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

```typescript
// frames/frames.service.ts
findAll(query: GetFramesQueryDto) {
  const qb = this.frameRepository.createQueryBuilder('frame')
    .where('frame.is_active = true');

  if (query.categoryId) qb.andWhere('frame.category = :categoryId', { categoryId: query.categoryId });
  if (query.sessionType) qb.andWhere('frame.session_type_supported = :sessionType', { sessionType: query.sessionType });
  if (query.minRating) qb.andWhere('frame.rating >= :minRating', { minRating: query.minRating });

  qb.orderBy(`frame.${query.sortBy}`, query.sortOrder?.toUpperCase() as 'ASC' | 'DESC');

  return qb.getMany();
}
```

> **Gợi ý hiển thị FE**: chỉ nên coi rating "đáng tin" khi `rating_count` đạt ngưỡng tối thiểu (vd ≥ 3 lượt) — 1 frame mới có đúng 1 lượt đánh giá 5 sao sẽ trông "hoàn hảo" nhưng không phản ánh đúng chất lượng thật. Có thể thêm logic ở FE: nếu `rating_count < 3`, hiển thị nhãn "Mới" thay vì số sao.

---

## 7. Index cho truy vấn sort/filter nhanh

```sql
CREATE INDEX idx_frame_rating ON "frame" (rating DESC) WHERE is_active = true;
CREATE INDEX idx_frame_category_rating ON "frame" (category, rating DESC) WHERE is_active = true;
```

---

## 8. Checklist

- [ ] Đăng bài kèm `rating` hợp lệ (1-5) → `Frame.rating` và `rating_count` cập nhật đúng công thức trung bình cộng
- [ ] Đăng bài **không** kèm rating → `Post.rating = null`, `Frame.rating`/`rating_count` **không đổi**
- [ ] Đăng bài với `rating` nhưng lượt chụp không dùng frame nào (`frame_id = null`) → trả lỗi `400`, không tạo được bài
- [ ] Đăng bài bằng `sessionId` không thuộc về mình → trả lỗi `403`
- [ ] Test race condition: 2 request đánh giá cùng 1 frame gửi gần như đồng thời → `rating_count` tăng đúng 2, không bị mất lượt nào
- [ ] `GET /frames?sortBy=rating&sortOrder=desc` → trả đúng thứ tự frame rating cao nhất trước
- [ ] `GET /frames?minRating=4` → chỉ trả frame có `rating >= 4`
- [ ] Constraint CHECK ở DB chặn được giá trị `rating` ngoài khoảng 1-5 kể cả khi có ai đó insert thẳng bằng SQL, không qua API

---

## 9. Việc cần xác nhận thêm với bạn

- **Bắt buộc hay không bắt buộc đánh giá khi đăng bài?** Hiện spec để `Post.rating` optional — nếu nghiệp vụ yêu cầu bắt buộc, cần đổi `@IsNumber()` thành có thêm `@IsNotEmpty()` và bỏ `@IsOptional()`.
- **Có cho sửa/xoá rating sau khi đã đăng không?** Nếu có, cần thêm API `PATCH /posts/:id` xử lý theo đúng công thức: revert rating cũ rồi apply rating mới trong cùng 1 transaction (tránh gọi 2 lần riêng biệt gây sai lệch tạm thời).
