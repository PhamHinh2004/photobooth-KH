# Spec — UI Trang "Đánh Giá" (Feed) + "Detail Feedback"

## Bối cảnh

2 trang Frontend cho tính năng Social đã thiết kế backend (`Post`, `Comment`, `PostLike`, liên kết `Account`):
- **Trang Feed** (`/reviews`): danh sách bài đăng dạng lưới, filter, search, stats tổng quan
- **Trang Detail** (`/reviews/:postId`): xem 1 bài chi tiết + khu vực thảo luận/bình luận lồng nhau

---

## 1. Design tokens

```css
:root {
  /* Màu chủ đạo — theo tông hồng-tím "Sweet Moments" đã dùng cho frame */
  --color-primary: #EC4899;       /* hồng chính — CTA, accent */
  --color-secondary: #A855F7;     /* tím — gradient, badge */
  --color-bg: #FFFFFF;
  --color-bg-soft: #FDF2F8;       /* nền hồng rất nhạt cho hero/card */
  --color-text: #27272A;
  --color-text-muted: #71717A;
  --color-border: #F3E8FF;
  --color-star: #FBBF24;          /* rating star */

  --gradient-hero: linear-gradient(135deg, #FDE2F3 0%, #E9D5FF 100%);
}
```

- **Font**: 1 sans-serif chính (vd `Inter` hoặc `Be Vietnam Pro` — hỗ trợ tiếng Việt tốt), heading dùng weight 700-800, body weight 400-500
- **Bo góc**: `rounded-xl` (12px) cho card, `rounded-full` cho avatar/badge/button pill
- **Shadow**: nhẹ, chỉ dùng cho card nổi bật khi hover (`hover:shadow-lg transition-shadow`), tránh đổ bóng nặng toàn bộ

---

## 2. Trang Feed (`/reviews`) — Cấu trúc component

```
FeedPage
├── AppHeader (nav: Trang chủ, Đặt lịch, Rating, Ứng dụng KH, Chăm sóc khách)
├── HeroSection
│   ├── Tiêu đề gradient "Cộng đồng đánh giá & Cảm hứng KH BOOTH"
│   ├── Mô tả ngắn
│   └── StatsBar (4.9 rating | 35.2K+ views | 98.6% satisfaction)
├── SearchAndFilterBar
│   ├── SearchInput
│   └── FilterTabs (Tất cả, Chụp đơn, Chụp đôi, Chụp nhóm)
│   └── DropdownFilters (Style, Sự kiện, Yêu thích, Sản phẩm mới)
├── PostGrid (3 cột desktop, 1 cột mobile)
│   └── PostCard × N
├── Pagination
└── AppFooter
```

### `HeroSection.tsx`

```tsx
function HeroSection({ stats }: { stats: { rating: number; views: string; satisfaction: string } }) {
  return (
    <section className="text-center py-16 px-4" style={{ background: 'var(--gradient-hero)' }}>
      <h1 className="text-4xl font-extrabold mb-3">
        Cộng đồng đánh giá &{' '}
        <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Cảm hứng KH BOOTH
        </span>
      </h1>
      <p className="text-zinc-600 max-w-xl mx-auto mb-8">
        Khám phá những khoảnh khắc rực rỡ và cảm hứng chân thực từ cộng đồng, nơi mỗi tấm ảnh kể một câu chuyện riêng.
      </p>
      <div className="flex justify-center gap-8">
        <StatItem icon="⭐" value={stats.rating} label="/5.0 đánh giá" />
        <StatItem icon="👁" value={stats.views} label="Lượt xem tuần này" />
        <StatItem icon="💗" value={stats.satisfaction} label="Khách hài lòng" />
      </div>
    </section>
  );
}

function StatItem({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      <div className="text-left">
        <div className="font-bold text-lg">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}
```

### `PostCard.tsx` — thành phần trung tâm của Feed

```tsx
interface PostCardProps {
  post: {
    id: string;
    cover_image_url: string;
    caption: string;
    likes_count: number;
    comments_count: number;
    style_tags: string[];
    created_at: string;
    account: { full_name: string; avatar_url?: string };
  };
  onApplyFrame: (postId: string) => void;
}

function PostCard({ post, onApplyFrame }: PostCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow">
      <a href={`/reviews/${post.id}`}>
        <img src={post.cover_image_url} alt={post.caption} className="w-full aspect-[3/4] object-cover" />
      </a>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={post.account.avatar_url ?? '/default-avatar.png'}
            className="w-6 h-6 rounded-full"
            alt={post.account.full_name}
          />
          <span className="text-sm font-medium">{post.account.full_name}</span>
          <span className="text-xs text-zinc-400 ml-auto">{formatRelativeTime(post.created_at)}</span>
        </div>

        <p className="text-sm text-zinc-700 line-clamp-2 mb-3">{post.caption}</p>

        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
          <LikeButton postId={post.id} initialCount={post.likes_count} />
          <span className="flex items-center gap-1">💬 {post.comments_count}</span>
        </div>

        <button
          onClick={() => onApplyFrame(post.id)}
          className="w-full py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold"
        >
          Áp Dụng Frame Này Ngay
        </button>
      </div>
    </div>
  );
}
```

### `LikeButton.tsx` — tích hợp realtime đã bàn ở spec trước

```tsx
function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const handler = (payload: { postId: string; likesCount: number }) => {
      if (payload.postId === postId) setCount(payload.likesCount);
    };
    socket.on('post:liked', handler);
    return () => { socket.off('post:liked', handler); };
  }, [postId]);

  async function handleClick() {
    setLiked((v) => !v); // optimistic update
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  }

  return (
    <button onClick={handleClick} className="flex items-center gap-1">
      <span className={liked ? 'text-pink-500' : ''}>❤️</span> {count}
    </button>
  );
}
```

### `FilterTabs.tsx`

```tsx
const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'single', label: 'Chụp đơn' },
  { value: 'couple', label: 'Chụp đôi' },
  { value: 'group', label: 'Chụp nhóm' },
];

function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === tab.value ? 'bg-pink-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 3. Trang Detail (`/reviews/:postId`) — Cấu trúc component

```
PostDetailPage
├── AppHeader
├── BreadcrumbBar (← Quay lại Cộng đồng Đánh giá)
├── DetailLayout (2 cột)
│   ├── LeftPanel
│   │   ├── PostImage (ảnh photo strip full)
│   │   ├── ApplyFrameButton
│   │   └── ShareBar (Copy link, Chia sẻ)
│   └── RightPanel
│       ├── PostHeader (avatar, tên, rating sao, ngày đăng)
│       ├── PostTitle + PostContent (review đầy đủ)
│       ├── ActionBar (like, comment count, share)
│       ├── DiscussionSection
│       │   ├── SectionTitle ("Thảo luận & Hỏi đáp" + tổng số)
│       │   ├── CommentInput
│       │   ├── CommentThread × N (hỗ trợ reply lồng nhau)
│       │   └── CommentPagination
└── AppFooter
```

### `PostDetailLayout.tsx`

```tsx
function PostDetailLayout({ post }: { post: PostDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 max-w-6xl mx-auto px-4 py-8">
      <div>
        <img src={post.cover_image_url} className="w-full rounded-xl" alt={post.caption} />
        <button className="mt-4 w-full py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold">
          Áp Dụng Frame Này Ngay
        </button>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2 rounded-full border border-zinc-200 text-sm">Copy link</button>
          <button className="flex-1 py-2 rounded-full border border-zinc-200 text-sm">Chia sẻ</button>
        </div>
      </div>

      <div>
        <PostHeader account={post.account} createdAt={post.created_at} />
        <p className="mt-4 text-zinc-700 whitespace-pre-line">{post.caption}</p>
        <ActionBar postId={post.id} likesCount={post.likes_count} commentsCount={post.comments_count} />
        <DiscussionSection postId={post.id} />
      </div>
    </div>
  );
}
```

### `CommentThread.tsx` — reply lồng nhau, đúng UI "Thảo luận & Hỏi đáp"

```tsx
interface CommentNode {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  account: { full_name: string; avatar_url?: string; role?: string };
  replies: CommentNode[];
}

function CommentThread({ comment, depth = 0 }: { comment: CommentNode; depth?: number }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expanded, setExpanded] = useState(depth < 1); // tự động mở reply cấp 1, ẩn bớt cấp sâu hơn

  return (
    <div className={depth > 0 ? 'ml-10 mt-3' : 'mt-4'}>
      <div className="flex gap-3">
        <img src={comment.account.avatar_url ?? '/default-avatar.png'} className="w-8 h-8 rounded-full" alt="" />
        <div className="flex-1">
          <div className="bg-zinc-50 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.account.full_name}</span>
              {comment.account.role === 'admin' && (
                <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full">
                  KH BOOTH Official Support
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-700 mt-1">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 px-2">
            <span>{formatRelativeTime(comment.created_at)}</span>
            <button>❤️ {comment.likes_count}</button>
            <button onClick={() => setShowReplyBox((v) => !v)}>Trả lời</button>
          </div>

          {showReplyBox && <CommentInput parentCommentId={comment.id} compact />}

          {comment.replies.length > 0 && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-xs text-pink-500 mt-2 ml-2">
              Xem thêm {comment.replies.length} trả lời khác
            </button>
          )}

          {expanded && comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Dựng cây comment từ dữ liệu phẳng trả về từ API

Vì `GET /posts/:id/comments` trả về danh sách phẳng (`parent_comment_id` nullable), cần build lại thành cây trước khi render:

```typescript
function buildCommentTree(flatComments: CommentNode[]): CommentNode[] {
  const map = new Map(flatComments.map((c) => [c.id, { ...c, replies: [] as CommentNode[] }]));
  const roots: CommentNode[] = [];

  for (const comment of map.values()) {
    if (comment.parent_comment_id) {
      map.get(comment.parent_comment_id)?.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }
  return roots;
}
```

### `DiscussionSection.tsx` — gộp lại, tích hợp realtime

```tsx
function DiscussionSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((flat) => {
        setComments(buildCommentTree(flat));
        setTotalCount(flat.length);
      });

    socket.emit('join:post', postId);
    const handler = (newComment: any) => {
      setComments((prev) => insertIntoTree(prev, newComment)); // thêm vào đúng vị trí cây
      setTotalCount((c) => c + 1);
    };
    socket.on('comment:created', handler);

    return () => {
      socket.emit('leave:post', postId);
      socket.off('comment:created', handler);
    };
  }, [postId]);

  return (
    <section className="mt-8">
      <h3 className="font-bold text-lg mb-4">Thảo luận & Hỏi đáp ({totalCount})</h3>
      <CommentInput postId={postId} />
      {comments.map((c) => (
        <CommentThread key={c.id} comment={c} />
      ))}
    </section>
  );
}
```

---

## 4. Mapping dữ liệu API → UI (tra cứu nhanh)

| UI hiển thị | Nguồn dữ liệu |
|---|---|
| Ảnh photo strip trong `PostCard`/`PostDetail` | `Post.cover_image_url` |
| Tên + avatar người đăng | `Post.account.full_name`, `account.avatar_url` |
| Số like | `Post.likes_count`, cập nhật realtime qua event `post:liked` |
| Số comment | `Post.comments_count`, cập nhật khi `comment:created` |
| "4.9" rating tổng trên Hero | Tính trung bình từ field rating (nếu có thêm cột `rating` trong `Post`, hiện schema chưa có — cần bổ sung nếu muốn hiển thị đúng) |
| Badge "KH BOOTH Official Support" | `Account.role === 'admin'` (nhân viên official trả lời) |
| "Xem thêm N trả lời khác" | `comment.replies.length` sau khi build cây |

> **Lưu ý**: mockup có hiển thị **rating sao (⭐ 4.9)** cho từng bài — nhưng schema `Post` hiện tại **chưa có cột `rating`**. Nếu bạn muốn giữ đúng UI này, cần bổ sung `Post.rating: number (1-5, nullable)` vào entity đã thiết kế trước đó.

---

## 5. Checklist

- [ ] Feed hiển thị đúng lưới 3 cột desktop, 1 cột mobile, ảnh giữ đúng tỉ lệ photo strip (dọc, không bị méo)
- [ ] Filter tabs đổi query `session_type` khi bấm, gọi lại `GET /posts?sessionType=...`
- [ ] Bấm "Áp Dụng Frame Này Ngay" → điều hướng sang màn hình chụp, tự chọn sẵn `frame_id` gắn với bài đó
- [ ] Trang Detail: reply lồng nhau hiển thị đúng thụt lề, không lồng quá sâu quá 2 cấp (giữ UI gọn như mockup)
- [ ] Comment mới từ người khác tự xuất hiện realtime khi đang mở trang Detail, không cần F5
- [ ] Responsive: layout 2 cột ở Detail chuyển thành 1 cột xếp dọc trên mobile
- [ ] Trạng thái rỗng: chưa có bài đăng nào → hiển thị empty state rõ ràng, không phải màn hình trắng
