# Đặc tả: Bài đánh giá thịnh hành

## 1. Mục tiêu

Xây dựng cơ chế nhận biết các bài đánh giá đang được cộng đồng quan tâm dựa trên lượt xem, bình luận, áp dụng frame và thả tim. Khi bài đạt ngưỡng, hệ thống gửi thông báo chúc mừng cho chủ bài; các bài đủ điều kiện được xếp hạng trong khu vực **Đang thịnh hành** theo thứ tự 1, 2, 3, ...

Tài liệu phân biệt hành vi đang có và hành vi đề xuất. Các ngưỡng, trọng số là giá trị khởi điểm cần product xác nhận, chưa phải hành vi đã triển khai.

## 2. Phạm vi và thuật ngữ

- **Bài đánh giá / post**: bài do khách đăng sau lượt chụp, có ảnh, caption, frame đã dùng và có thể có điểm rating.
- **Rating sao**: điểm 1–5 mà khách chấm cho frame. Đây không phải điểm thịnh hành của bài.
- **Tín hiệu tương tác**: lượt xem hợp lệ, lượt thích đang hiệu lực, bình luận hợp lệ và lượt áp dụng frame đã hoàn tất.
- **Điểm thịnh hành**: điểm tổng hợp tín hiệu trong một cửa sổ thời gian, dùng để xác định điều kiện và xếp hạng bài.
- **Lượt áp dụng hoàn tất**: người xem bắt đầu lượt chụp mới bằng frame từ bài nguồn. Chỉ nhấn nút dẫn tới màn capture chưa được tính là áp dụng thành công.

Phạm vi gồm đo lường tương tác, xếp hạng bài, thông báo trong ứng dụng, cập nhật realtime và trạng thái hiển thị. Không gồm thay đổi công thức rating trung bình của frame, đề xuất cá nhân hóa, quảng cáo hoặc xây mới hệ thống kiểm duyệt.

## 3. Hiện trạng đọc từ codebase

### Backend

- `Post` đã lưu `likes_count`, `comments_count`, `views_count`, `status`, `rating` và `created_at`. `rating` bị ràng buộc 1–5 và dùng để cập nhật rating trung bình của frame.
- `GET /posts` trả feed phân trang theo `created_at DESC`; chưa có sort/filter theo độ thịnh hành.
- `GET /posts/:id` tăng `views_count` mỗi lần gọi chi tiết. Chưa có khử trùng lặp theo tài khoản/phiên, nên refresh hoặc gọi lặp có thể tăng view.
- `POST /posts/:id/like` bật/tắt like; mỗi tài khoản chỉ có một bản ghi like cho một post. Backend cập nhật `likes_count` và phát event `post.liked`.
- Tạo comment làm tăng `comments_count`; xóa comment làm giảm bộ đếm. Comment tạo/sửa/xóa được phát qua Socket.IO tới room của post.
- Chưa có trường số lượt áp dụng ở post. Nút áp dụng hiện lấy frame từ chi tiết post rồi điều hướng sang `/capture`; backend chưa nhận được quan hệ giữa bài nguồn và lượt chụp mới.
- `SocialGateway` phát post mới/sửa/xóa/like tới feed hoặc room post; chưa có room riêng tư theo tài khoản hoặc event notification.
- Các module hiện có không có module/entity/API lưu notification.

### Frontend

- `FeedPage` tải trang đầu và hiển thị các `PostCard`; tab hiện tại là Tất cả, Chụp nhóm, Chụp đơn. FE gửi filter nhưng API `GET /posts` hiện chỉ đọc page/limit nên filter chưa được thực thi ở backend.
- `PostCard` hiển thị like, view, comment và nút áp dụng frame. View tăng khi mở trang chi tiết vì trang đó gọi `GET /posts/:id`.
- `LikeButton` cập nhật giao diện lạc quan; trạng thái liked ban đầu đọc từ localStorage. Backend chưa có API trả trạng thái đã like theo tài khoản.
- `MyPostsPage` hiển thị like và comment, chưa hiển thị view, apply, trạng thái thịnh hành hoặc thông báo.
- Socket hook đồng bộ feed cho post mới/sửa/xóa/like và comment khi join post; chưa nhận rank hoặc notification.

### Điểm vào code tham khảo

- Backend: [posts.controller.ts](../Back-end/photobooth-backend/src/modules/posts/posts.controller.ts), [posts.service.ts](../Back-end/photobooth-backend/src/modules/posts/posts.service.ts), [post.entity.ts](../Back-end/photobooth-backend/src/modules/posts/entities/post.entity.ts), [comments.service.ts](../Back-end/photobooth-backend/src/modules/comments/comments.service.ts), [social.gateway.ts](../Back-end/photobooth-backend/src/modules/social/social.gateway.ts).
- Frontend: [FeedPage.tsx](../Front-end/photobooth-frontend/src/pages/social/FeedPage.tsx), [PostCard.tsx](../Front-end/photobooth-frontend/src/components/social/PostCard.tsx), [LikeButton.tsx](../Front-end/photobooth-frontend/src/components/social/LikeButton.tsx), [MyPostsPage.tsx](../Front-end/photobooth-frontend/src/pages/social/MyPostsPage.tsx), [social.api.ts](../Front-end/photobooth-frontend/src/api/social.api.ts), [useSocialSocket.ts](../Front-end/photobooth-frontend/src/hooks/useSocialSocket.ts).
- Đặc tả rating frame: [rating-feature-spec.md](rating-feature-spec.md).

## 4. Yêu cầu nghiệp vụ

1. Bài đủ điều kiện và có điểm cao hơn được đứng trước trong feed Đang thịnh hành; thứ hạng đánh số liên tục từ 1.
2. Điểm phản ánh tương tác gần đây, không chỉ tổng tương tác từ ngày đăng. Feed mới nhất vẫn giữ thứ tự hiện tại.
3. Chủ bài nhận lời chúc mừng khi bài lần đầu đạt mốc thịnh hành; có thể nhận thêm mốc cao hơn đã cấu hình. Không gửi lặp cùng một mốc.
4. Một người không thể tạo vô hạn tín hiệu cho cùng bài bằng refresh, like/unlike liên tục hoặc gửi lặp request.
5. Chỉ tính bài `published`; bài bị xóa/ẩn không xuất hiện trong xếp hạng và không phát sinh thông báo mới.
6. Không tính tương tác do chính chủ bài tạo vào điểm thịnh hành.
7. Bộ đếm hiện tại tiếp tục phục vụ hiển thị tổng; điểm thịnh hành là dữ liệu riêng theo cửa sổ thời gian, không ghi đè `likes_count`, `comments_count` hoặc `views_count`.

## 5. Quy tắc tính tín hiệu và điểm đề xuất

### 5.1 Cửa sổ và trọng số khởi điểm

Đề xuất dùng cửa sổ trượt 7 ngày và tính điểm theo tín hiệu đã xác thực:

| Tín hiệu | Điểm khởi điểm | Điều kiện tính |
|---|---:|---|
| Lượt xem hợp lệ | 1 | Tối đa một lượt xem/tài khoản/bài/24 giờ |
| Like đang còn hiệu lực | 2 | Một tài khoản đóng góp tối đa 1 like/bài; unlike thì bỏ đóng góp |
| Bình luận hợp lệ | 3 | Tối đa một bình luận được tính/tài khoản/bài/24 giờ; phải còn tồn tại và không phải comment của chủ bài |
| Áp dụng frame hoàn tất | 5 | Mỗi tài khoản/bài/session mới chỉ tính một lần; session phải được backend xác nhận |

```text
trend_score = 1 * views_7d
            + 2 * active_likes_7d
            + 3 * qualified_comments_7d
            + 5 * completed_applies_7d
```

Trọng số phải đặt trong cấu hình backend để thay đổi mà không cần sửa FE. Like chỉ được tính trong cửa sổ nếu phát sinh trong cửa sổ và còn active; view/comment/apply dùng event có thời gian phát sinh.

### 5.2 Điều kiện vào bảng thịnh hành

Đề xuất ban đầu, cần hiệu chỉnh theo dữ liệu thực tế:

- `trend_score >= 30` trong cửa sổ 7 ngày.
- Có ít nhất 10 tài khoản khác nhau tạo tín hiệu hợp lệ.
- Có ít nhất 2 loại tín hiệu khác nhau; chỉ view đơn thuần không đủ để vào bảng.
- Bài ở trạng thái `published` và không bị đánh dấu vi phạm.

Bài rời bảng khi điểm xuống dưới ngưỡng hoặc bài chuyển sang hidden/deleted. Rank được tính lại sau mỗi batch cập nhật thống kê.

### 5.3 Xếp thứ tự

Sắp xếp theo `trend_score DESC`, số tài khoản tương tác duy nhất trong 7 ngày DESC, thời điểm tương tác gần nhất DESC, rồi `created_at DESC` để có kết quả ổn định. API trả `trend_rank` bắt đầu từ 1. Rank có thể thay đổi khi dữ liệu mới đến hoặc event cũ hết cửa sổ; FE không tự tính rank từ bộ đếm tổng.

### 5.4 Chống gian lận và dữ liệu bất thường

- Người dùng đăng nhập được khử trùng lặp view theo account. Guest view cần visitor key ngẫu nhiên, có hạn dùng; không lưu IP thô để làm định danh thống kê.
- Không tin `account_id`, score hoặc rank do client gửi lên. Backend lấy actor từ JWT khi có đăng nhập.
- Comment chỉ được tính sau khi tạo thành công; xóa comment thì điểm giảm. Có thể bổ sung lọc spam/kiểm duyệt ở giai đoạn sau.
- Like chỉ tính trạng thái active; request lặp không làm lệch bộ đếm hoặc nhân đôi điểm.
- Apply không được ghi bằng một con số do client tự khai. Gắn `source_post_id` vào luồng tạo lượt chụp và chỉ tính khi backend xác nhận session/photo mới dùng đúng frame nguồn.
- Không tính tương tác của chủ bài, tài khoản bị vô hiệu hóa hoặc event trùng `dedupe_key`; giới hạn tốc độ các endpoint ghi nhận.

## 6. Quy tắc thông báo

Thông báo đầu tiên khi bài vượt điều kiện vào bảng:

> Chúc mừng! Bài đánh giá của bạn đang được nhiều người quan tâm và đã lọt vào mục Đang thịnh hành.

Các mốc cao hơn có thể là điểm 100/500 hoặc lần đầu vào Top 3. Mỗi mốc chỉ gửi một lần cho mỗi post; không gửi thông báo cho từng lượt view/like/comment. Notification lưu `post_id`, `milestone_key`, `trend_score`, `trend_rank` tại thời điểm phát sinh và đường dẫn mở bài. Nếu bài rời bảng rồi quay lại, không phát lại mốc cũ.

Notification phải được lưu trong database để người dùng xem khi offline, sau đó mới phát Socket.IO tới room riêng `account:{accountId}`. FE hiển thị toast/badge và mở `/reviews/:postId`; nếu bài không còn công khai thì hiển thị trạng thái phù hợp.

## 7. Thiết kế backend đề xuất

### 7.1 Dữ liệu

Giữ các bộ đếm hiện có và bổ sung dữ liệu chuyên biệt:

- `post_engagement_events`: `id`, `post_id`, `actor_account_id` nullable, `event_type` (`view`, `like`, `comment`, `apply`), `source_id` nullable, `dedupe_key`, `occurred_at`. Tạo unique constraint trên khóa khử trùng lặp phù hợp và index `(post_id, occurred_at)`, `(event_type, occurred_at)`.
- `post_trend_stats` hoặc bảng tổng hợp tương đương: `post_id`, bộ đếm 7 ngày theo loại, `unique_actor_count`, `trend_score`, `trend_rank`, `last_engagement_at`, `calculated_at`. Đây là cache có thể dựng lại từ event ledger.
- `notifications`: `id`, `account_id`, `type`, `post_id`, `milestone_key`, `payload JSONB`, `created_at`, `read_at`. Unique `(account_id, post_id, type, milestone_key)` để bảo đảm idempotency.

Không nên chỉ dùng bộ đếm tổng hiện tại để xếp hạng theo 7 ngày, vì không xác định được tương tác nào nằm trong cửa sổ. Nếu không lưu event ledger, cần đặc tả rõ cơ chế khử trùng lặp và tính lại.

### 7.2 Ghi nhận event

- **View:** tránh tăng view đủ điều kiện trên mọi lần gọi `GET /posts/:id`; ghi event sau khi xác định view hợp lệ, đồng thời duy trì counter tổng tương thích ngược.
- **Like:** đồng bộ event/điểm active với `post_likes` trong luồng toggle like.
- **Comment:** tạo event sau khi tạo comment thành công; vô hiệu hóa/loại event khi comment bị xóa. `dedupe_key` có thể biểu diễn giới hạn một comment được tính mỗi account/ngày.
- **Apply:** truyền `source_post_id` từ CTA qua capture; xác minh frame bài nguồn khớp frame của session/photo mới rồi ghi event theo session/photo ID.
- Bảo đảm event, aggregate và notification nhất quán. Với cập nhật async, dùng transactional outbox hoặc job idempotent để không mất thông báo nếu tiến trình dừng giữa chừng.

### 7.3 Tính điểm và rank

- Bản đầu có thể tính bằng job định kỳ (ví dụ mỗi phút) hoặc queue sau event; tránh tổng hợp toàn bộ lịch sử trên mỗi request feed.
- Khi tải tăng, dùng bảng aggregate và job loại event hết hạn; có cơ chế reconcile với event ledger.
- Cập nhật rank theo batch để API không trả rank trùng hoặc bỏ số trong cùng snapshot.
- Chỉ phát event `post:trending-updated` khi trạng thái/rank thay đổi đáng kể, không broadcast sau mỗi view.

### 7.4 API đề xuất

| API | Mục đích | Ghi chú |
|---|---|---|
| `GET /posts?sort=trending&page=1&limit=20` | Lấy feed thịnh hành | `GET /posts` mặc định vẫn newest; response thêm `trend_score`, `trend_rank`, `trend_status` |
| `GET /posts/me` | Lấy bài của người dùng | Bổ sung thống kê và trạng thái/rank thịnh hành |
| `GET /notifications?page=1&limit=20` | Danh sách notification | Phân trang, mới nhất trước, có trạng thái đọc |
| `GET /notifications/unread-count` | Đếm notification chưa đọc | Dùng cho badge chuông |
| `PATCH /notifications/:id/read` | Đánh dấu đã đọc | Chỉ chủ notification được thao tác |
| `POST /posts/:id/view` (tùy chọn) | Ghi nhận view rõ ràng | Backend xác thực/dedupe; dùng nếu không ghi nhận hợp lệ từ route detail |

Không tạo API cho FE gửi số apply tùy ý. `source_post_id` phải đi cùng luồng tạo session/photo và được backend xác minh.

Response post dự kiến:

```json
{
  "id": "uuid",
  "likes_count": 18,
  "comments_count": 7,
  "views_count": 240,
  "applies_count": 12,
  "trend": {
    "status": "trending",
    "score": 86,
    "rank": 2,
    "window": "7d"
  }
}
```

`applies_count` và các trường `trend` là phần mới đề xuất; response hiện tại chưa bảo đảm có chúng.

## 8. Thiết kế frontend đề xuất

### Feed đánh giá

- Thêm tab `Đang thịnh hành`, giữ chế độ mới nhất/tất cả riêng để người dùng chủ động chọn.
- Nối filter nhóm/đơn vào backend; hiện các tab chỉ đổi state phía FE.
- Card thịnh hành hiển thị badge `#1`, `#2`, `#3` hoặc rank tương ứng, nhãn thịnh hành, like/view/comment/apply và rating sao frame ở vị trí phân biệt.
- Không dùng rating sao thay cho trend score. Chỉ hiển thị điểm thô nếu product yêu cầu.
- Khi rank đổi realtime, tránh làm trang nhảy lúc người dùng đang đọc; có thể hiện banner “Bảng thịnh hành đã cập nhật” và cho tải lại.

### Trang bài của tôi

- Bổ sung view, apply, trạng thái thịnh hành và rank hiện tại.
- Bài chưa đủ điều kiện hiển thị `Chưa vào mục thịnh hành`, không hiển thị rank giả.
- Ghi rõ khoảng thời gian của số liệu, ví dụ “7 ngày qua”, tách biệt với tổng lifetime.

### Notification

- Thêm chuông thông báo ở layout đã đăng nhập, badge unread count, danh sách notification và trạng thái đọc.
- Khi nhận `notification:created`, cập nhật badge/list và hiển thị toast một lần.
- Khi người dùng mở notification, điều hướng tới post và cập nhật read state qua API.
- Không hiển thị notification của tài khoản khác; khi socket reconnect tải lại list/unread count từ API.

### Nút áp dụng frame

- Gửi `source_post_id` xuyên suốt navigation/capture state.
- Chỉ ghi nhận thành công sau khi backend xác nhận lượt chụp mới dùng frame nguồn; thoát giữa luồng không được tính.
- Nếu không thể tiếp tục dùng frame hoặc post đã ẩn, thông báo phù hợp và không tăng count.

## 9. Socket.IO đề xuất

- Xác thực JWT và cho socket tham gia room riêng `account:{accountId}`; không để client tự join room của tài khoản khác.
- `notification:created`: payload notification đã được lưu.
- `post:trending-updated`: post id, trạng thái, rank và score; có thể chỉ gửi invalidate signal nếu muốn giới hạn payload.
- `post:stats-updated` tùy chọn cho card/detail đang mở.
- Event hiện có `post:liked` và comment realtime tiếp tục phục vụ đồng bộ tương tác; broadcast tới room `feed` không phải notification cá nhân.

## 10. Tiêu chí nghiệm thu

1. Nhiều lần mở/refresh cùng bài trong 24 giờ không tạo nhiều hơn một view đủ điều kiện theo policy đã chọn.
2. Like/unlike và duplicate request giữ `likes_count`, active like và trend score chính xác.
3. Comment hợp lệ được tính theo giới hạn; comment bị xóa không tiếp tục đóng góp.
4. Apply chỉ tính khi backend xác nhận session/photo mới dùng frame nguồn; điều hướng capture rồi thoát không được tính.
5. Tương tác chủ bài, post hidden/deleted và event trùng không giúp bài đủ điều kiện.
6. Với dữ liệu xác định, công thức và tie-breaker cho kết quả rank ổn định.
7. Feed newest giữ thứ tự hiện tại; feed trending chỉ trả bài published đủ điều kiện, sắp xếp đúng và phân trang không lặp/mất bài.
8. Khi vượt mốc, chủ bài nhận đúng một notification; retry job hoặc socket reconnect không tạo notification trùng.
9. Mốc cao hơn chỉ gửi đúng một lần; không phát lại mốc cũ khi bài ra/vào bảng.
10. Tài khoản chỉ đọc/đánh dấu đã đọc notification của mình; socket không cho join room người khác.
11. FE đồng bộ badge, toast, rank và danh sách; offline/reconnect đồng bộ lại qua API.
12. Có test cho scoring, dedupe, tie, ngưỡng, quyền notification, post hidden/deleted và race/retry.

## 11. Câu hỏi cần product xác nhận

- Chọn ngưỡng vào bảng và mốc thông báo nào? Đề xuất thử score `>= 30`, tối thiểu 10 người và 2 loại tín hiệu; cần hiệu chỉnh bằng dữ liệu thực tế.
- Cửa sổ 7 ngày có phù hợp không, hay muốn 24 giờ/30 ngày?
- Có gửi thông báo khi vào Top 3/tăng hạng hay chỉ khi đạt mốc điểm? Đề xuất lần đầu vào bảng và mốc cao hơn để tránh spam.
- Có tính view của người chưa đăng nhập không? Nếu có, cần chọn cơ chế visitor key và thời hạn lưu.
- Apply được xác định khi bắt đầu capture, khi lưu ảnh hay khi đăng bài từ frame đó? Đề xuất khi backend tạo thành công session/photo mới.
- Có giới hạn tuổi bài được vào bảng không? Bài cũ vẫn có thể thịnh hành lại nếu tương tác 7 ngày gần nhất tăng.
- Rank là bảng chung hay cá nhân hóa? Đề xuất giai đoạn đầu dùng bảng chung để minh bạch và dễ kiểm thử.

## 12. Lộ trình triển khai gợi ý

1. Chốt ngưỡng và định nghĩa apply/view, đặc biệt với guest.
2. Bổ sung schema event, aggregate, notification và migration/backfill phù hợp.
3. Tích hợp ghi nhận view/like/comment/apply ở backend; thêm test idempotency và quyền truy cập.
4. Xây job tính điểm/rank, feed trending và API notification.
5. Bổ sung account socket room, notification event và đồng bộ realtime.
6. Thêm tab trending, rank badge, thống kê bài của tôi và UI chuông notification.
7. Thử nghiệm staging, theo dõi phân bố điểm/notification và điều chỉnh cấu hình trước khi phát hành rộng.