import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Camera,
  ChevronRight,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Send,
  Sparkles,
  X,
  Plus,
  Trash2,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react'
import { Dropdown, Modal, message as antMessage } from 'antd'
import axiosInstance from '@/api/axios'
import { useAuthStore } from '@/stores/auth.store'
import { chatboxApi, ChatSessionItem } from '@/api/chatbox.api'
import type { Frame } from '@/types/capture.types'
import './AiFrameAssistant.css'

type AssistantFrame = Frame & {
  width?: number
  height?: number
  usage_count?: number
}

type AssistantPost = {
  id: string
  status?: 'published' | 'hidden'
  cover_image_url?: string
  caption?: string | null
  likes_count?: number
  views_count?: number
  comments_count?: number
  account?: {
    username?: string
    full_name?: string
    customer?: { fullName?: string | null; full_name?: string | null } | null
  } | null
}

type AssistantData = {
  frames: AssistantFrame[]
  posts: AssistantPost[]
  frameError: boolean
  postError: boolean
}

type PostMetric = 'likes_count' | 'views_count' | 'comments_count'

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
  frames?: AssistantFrame[]
  posts?: AssistantPost[]
  metric?: PostMetric
  postRankings?: { metric: PostMetric; posts: AssistantPost[] }[]
  note?: string
}

const QUICK_PROMPTS = [
  { label: 'Frame đơn 4 ảnh', icon: Camera, prompt: 'Chụp đơn 4 ảnh thì frame nào phù hợp?' },
  { label: 'Frame 6 ảnh', icon: Sparkles, prompt: 'Gợi ý frame chụp 6 ảnh' },
  { label: 'Bài nhiều lượt tim', icon: Heart, prompt: 'Bài viết nào nhiều lượt tim nhất?' },
  { label: 'Frame dùng nhiều', icon: Flame, prompt: 'Frame nào được áp dụng nhiều nhất?' },
]

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function makeMessage(message: Omit<AssistantMessage, 'id'>): AssistantMessage {
  return { ...message, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

function getFrameSlots(frame: AssistantFrame) {
  return frame.layout_config?.slots?.length ?? 0
}

function getSupportedSession(frame: AssistantFrame, session: 'single' | 'group') {
  return frame.session_type_supported === session || frame.session_type_supported === 'both'
}

function getPostAuthor(post: AssistantPost) {
  return post.account?.customer?.fullName
    || post.account?.customer?.full_name
    || post.account?.full_name
    || post.account?.username
    || 'Thành viên KH Booth'
}

function formatCount(value?: number) {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0);
}

function renderInlineText(text: string) {
  const cleaned = text.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?b>/gi, '**');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function FormattedAiBubble({ text }: { text: string }) {
  const rawLines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      blocks.push(
        <ul className="ai-bubble-list" key={`${keyPrefix}-list-${blocks.length}`}>
          {currentList.map((item, i) => (
            <li key={i} className="ai-bubble-list-item">
              <span className="ai-bullet-dot">•</span>
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  rawLines.forEach((rawLine, lineIdx) => {
    let line = rawLine.trim();

    // Bỏ qua dòng phân cách bảng markdown |---|---|
    if (/^\|[\s\-:|]+\|$/.test(line)) {
      return;
    }

    // Xử lý dòng bảng thô (| Slot | Pose | ... |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList(`line-${lineIdx}`);
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      // Bỏ qua header bảng
      if (cells.some((c) => /slot|pose|hướng dẫn|thời gian/i.test(c))) {
        return;
      }

      if (cells.length >= 2) {
        const titleCell = cells[0];
        const detailCell = cells.slice(1).join(' · ');
        blocks.push(
          <div className="ai-shot-card" key={`table-row-${lineIdx}`}>
            <div className="ai-shot-title">
              📸 {renderInlineText(titleCell)}
            </div>
            <div className="ai-shot-desc">
              {renderInlineText(detailCell)}
            </div>
          </div>
        );
        return;
      }
    }

    if (!line) {
      flushList(`line-${lineIdx}`);
      return;
    }

    // Tiêu đề (### hoặc ##)
    if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
      flushList(`line-${lineIdx}`);
      const cleanHeading = line.replace(/^#+\s*/, '');
      blocks.push(
        <h4 className="ai-heading-block" key={`h-${lineIdx}`}>
          <Sparkles size={13} className="ai-heading-icon" />
          <span>{renderInlineText(cleanHeading)}</span>
        </h4>
      );
      return;
    }

    // Thẻ Shot
    if (/^(?:📸\s*)?Shot\s*\d+/i.test(line) || /^[1-8]️⃣/i.test(line)) {
      flushList(`line-${lineIdx}`);
      blocks.push(
        <div className="ai-shot-card" key={`shot-${lineIdx}`}>
          <div className="ai-shot-title">
            <span>{renderInlineText(line)}</span>
          </div>
        </div>
      );
      return;
    }

    // Mẹo / Tip callout
    if (/^(?:💡|\*|\-)?\s*(?:mẹo|tip|lưu ý):/i.test(line)) {
      flushList(`line-${lineIdx}`);
      blocks.push(
        <div className="ai-tip-box" key={`tip-${lineIdx}`}>
          <span className="ai-tip-badge">💡 MẸO</span>
          <span>{renderInlineText(line.replace(/^(?:💡|\*|\-)?\s*(?:mẹo|tip|lưu ý):\s*/i, ''))}</span>
        </div>
      );
      return;
    }

    // Gạch đầu dòng: - hoặc • hoặc *
    if (/^[-*•]\s+/.test(line)) {
      const cleanItem = line.replace(/^[-*•]\s+/, '');
      currentList.push(cleanItem);
      return;
    }

    // Đoạn văn thông thường
    flushList(`line-${lineIdx}`);
    blocks.push(
      <p className="ai-bubble-paragraph" key={`p-${lineIdx}`}>
        {renderInlineText(line)}
      </p>
    );
  });

  flushList('end');

  return <div className="ai-formatted-text">{blocks}</div>;
}

export default function AiFrameAssistant() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessions, setSessions] = useState<ChatSessionItem[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)
  const [data, setData] = useState<AssistantData>({ frames: [], posts: [], frameError: false, postError: false })
  const [messages, setMessages] = useState<AssistantMessage[]>([
    makeMessage({
      role: 'assistant',
      text: 'Chào bạn, mình là KH AI Studio. Mình có thể gợi ý frame theo số ảnh, cho biết kích thước/layout và tổng hợp bài viết đang có nhiều tương tác.',
    }),
  ])
  const didLoad = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function loadSessions() {
    if (!isAuthenticated) return
    try {
      const sessionList = await chatboxApi.getSessions()
      setSessions(sessionList)
      if (sessionList.length > 0 && !currentSessionId) {
        await selectSession(sessionList[0].id)
      }
    } catch (e) {
      console.error('Lỗi tải danh sách phiên chat:', e)
    }
  }

  async function selectSession(sessionId: string) {
    setCurrentSessionId(sessionId)
    setIsLoading(true)
    try {
      const sessionData = await chatboxApi.getSession(sessionId)
      if (sessionData && sessionData.messages && sessionData.messages.length > 0) {
        const loaded: AssistantMessage[] = sessionData.messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.content,
          ...(m.metadata || {}),
        }))
        setMessages(loaded)
      } else {
        setMessages([
          makeMessage({
            role: 'assistant',
            text: 'Chào bạn, mình là KH AI Studio. Hãy đặt câu hỏi để mình gợi ý nhé!',
          }),
        ])
      }
    } catch (e) {
      console.error('Lỗi khi mở phiên chat:', e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateNewSession() {
    if (isAuthenticated) {
      try {
        const newSession = await chatboxApi.createSession('Cuộc trò chuyện mới')
        setSessions((prev) => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
      } catch (e) {
        console.error('Lỗi tạo phiên mới:', e)
      }
    } else {
      setCurrentSessionId(null)
    }
    setMessages([
      makeMessage({
        role: 'assistant',
        text: 'Chào bạn, mình là KH AI Studio. Mình có thể gợi ý frame theo số ảnh, cho biết kích thước/layout và tổng hợp bài viết đang có nhiều tương tác.',
      }),
    ])
  }

  async function handleDeleteSingleSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    try {
      await chatboxApi.deleteSession(sessionId)
      const remaining = sessions.filter((s) => s.id !== sessionId)
      setSessions(remaining)
      antMessage.success('Đã xóa đoạn hội thoại')
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          void selectSession(remaining[0].id)
        } else {
          void handleCreateNewSession()
        }
      }
    } catch (e) {
      antMessage.error('Không thể xóa đoạn hội thoại')
    }
  }

  async function handleDeleteAllSessions() {
    try {
      await chatboxApi.deleteAllSessions()
      setSessions([])
      setCurrentSessionId(null)
      setIsClearAllModalOpen(false)
      setMessages([
        makeMessage({
          role: 'assistant',
          text: 'Đã xóa toàn bộ lịch sử trò chuyện. Bạn có thể bắt đầu cuộc trò chuyện mới!',
        }),
      ])
      antMessage.success('Đã xóa toàn bộ lịch sử')
    } catch (e) {
      antMessage.error('Không thể xóa toàn bộ lịch sử')
    }
  }

  async function handleDeleteSingleMessage(msgId: string) {
    try {
      if (isAuthenticated) {
        await chatboxApi.deleteMessage(msgId)
      }
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      antMessage.success('Đã xóa tin nhắn')
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      antMessage.success('Đã xóa tin nhắn')
    }
  }

  async function loadReferenceData() {
    setIsRefreshing(true)
    const [framesResult, postsResult] = await Promise.allSettled([
      axiosInstance.get<AssistantFrame[]>('/frames?sortBy=usage_count&sortOrder=desc'),
      axiosInstance.get<{ data?: AssistantPost[] }>('/posts?page=1&limit=100'),
    ])

    const nextData: AssistantData = {
      frames: framesResult.status === 'fulfilled' && Array.isArray(framesResult.value.data)
        ? framesResult.value.data
        : [],
      posts: postsResult.status === 'fulfilled' && Array.isArray(postsResult.value.data?.data)
        ? postsResult.value.data.data.filter((post) => post.status !== 'hidden')
        : [],
      frameError: framesResult.status === 'rejected',
      postError: postsResult.status === 'rejected',
    }

    setData(nextData)
    didLoad.current = true
    setIsRefreshing(false)
    return nextData
  }

  useEffect(() => {
    if (isOpen && !didLoad.current) void loadReferenceData()
    if (isOpen && isAuthenticated) void loadSessions()
  }, [isOpen, isAuthenticated])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  function createFrameAnswer(query: string, referenceData: AssistantData): AssistantMessage {
    const normalized = normalizeText(query)
    const countMatch = normalized.match(/\b(4|6|8)\s*(?:anh|tam|slot|khung)\b/)
    const requestedCount = countMatch ? Number(countMatch[1]) : null
    const session = /nhom|group/.test(normalized) ? 'group' : 'single'
    const sessionLabel = session === 'single' ? 'chụp đơn' : 'chụp nhóm'

    if (requestedCount) {
      const suitable = referenceData.frames
        .filter((frame) => getFrameSlots(frame) === requestedCount && getSupportedSession(frame, session))
        .sort((first, second) => (second.rating ?? 0) - (first.rating ?? 0))
        .slice(0, 3)

      if (!suitable.length) {
        return makeMessage({
          role: 'assistant',
          text: referenceData.frameError
            ? 'Mình chưa tải được danh sách frame từ hệ thống. Bạn thử tải lại dữ liệu hoặc mở màn Chọn Frame để xem các lựa chọn mới nhất nhé.'
            : `Hiện mình chưa tìm thấy frame ${requestedCount} ảnh phù hợp cho ${sessionLabel}. Bạn có thể thử số ảnh khác hoặc đổi sang chụp nhóm/đơn.`,
        })
      }

      return makeMessage({
        role: 'assistant',
        text: `Mình tìm thấy ${suitable.length} frame ${requestedCount} ảnh phù hợp cho ${sessionLabel}. Mình ưu tiên rating tốt và số lượt đánh giá để gợi ý:`,
        frames: suitable,
      })
    }

    const asksDimensions = /kich thuoc|chieu cao|chieu dai|thong so|bao nhieu px|layout|so o/.test(normalized)
    if (asksDimensions) {
      const requestedName = normalized
        .replace(/(kich thuoc|chieu cao|chieu dai|thong so|bao nhieu px|layout|so o|frame|khung|la bao nhieu|the nao)/g, ' ')
        .trim()
      const matches = referenceData.frames
        .filter((frame) => !requestedName || normalizeText(frame.name).includes(requestedName))
        .slice(0, 3)

      if (matches.length) {
        return makeMessage({
          role: 'assistant',
          text: requestedName
            ? 'Đây là thông số frame mình tìm được theo tên bạn hỏi:'
            : 'Mình gửi một vài thông số frame đang có trong hệ thống. Kích thước canvas hiển thị theo pixel:',
          frames: matches,
        })
      }
      return makeMessage({
        role: 'assistant',
        text: 'Mình chưa tìm được frame khớp với tên đó. Bạn thử nhập tên frame hoặc hỏi theo số ảnh, ví dụ “frame đơn 4 ảnh”.',
      })
    }

    const asksFrameUsage = /frame|khung|ap dung|su dung|dung nhieu|hot|pho bien/.test(normalized)
    if (asksFrameUsage) {
      const ranked = [...referenceData.frames].sort((first, second) => {
        const usageDifference = (second.usage_count ?? 0) - (first.usage_count ?? 0)
        if (usageDifference !== 0) return usageDifference
        const ratingDifference = (second.rating ?? 0) - (first.rating ?? 0)
        return ratingDifference || (second.rating_count ?? 0) - (first.rating_count ?? 0)
      }).slice(0, 3)
      const usageTracked = ranked.some((frame) => (frame.usage_count ?? 0) > 0)

      return makeMessage({
        role: 'assistant',
        text: referenceData.frameError
          ? 'Mình chưa tải được dữ liệu frame. Bạn có thể thử lại sau nhé.'
          : usageTracked
            ? 'Theo số lượt sử dụng frame mà hệ thống hiện trả về, đây là các frame đang dẫn đầu:'
            : 'BE hiện chưa ghi nhận lượt sử dụng frame (usage_count đang bằng 0), nên mình chưa thể xác nhận frame nào được áp dụng nhiều nhất. Đây là vài frame có rating tốt để bạn tham khảo:',
        frames: ranked,
        note: !usageTracked && !referenceData.frameError ? 'Gợi ý thay thế dựa trên rating, không phải số lượt sử dụng.' : undefined,
      })
    }

    return makeMessage({
      role: 'assistant',
      text: 'Bạn muốn tìm frame theo số ảnh/kích thước, xem frame được dùng nhiều, hay tìm bài viết nhiều tim, lượt xem hoặc bình luận?',
    })
  }

  function createPostAnswer(query: string, referenceData: AssistantData): AssistantMessage | null {
    const normalized = normalizeText(query)
    const isPostQuestion = /bai viet|bai dang|post|feed|luot tim|thich|like|luot xem|view|comment|binh luan/.test(normalized)
    if (!isPostQuestion) return null

    const requestedMetrics: PostMetric[] = []
    if (/luot tim|thich|like/.test(normalized)) requestedMetrics.push('likes_count')
    if (/luot xem|view/.test(normalized)) requestedMetrics.push('views_count')
    if (/comment|binh luan/.test(normalized)) requestedMetrics.push('comments_count')
    if (requestedMetrics.length === 0) requestedMetrics.push('likes_count')
    const rankings = requestedMetrics.map((metric) => ({
      metric,
      posts: [...referenceData.posts]
        .sort((first, second) => (second[metric] ?? 0) - (first[metric] ?? 0))
        .slice(0, 3),
    }))

    if (referenceData.postError) {
      return makeMessage({ role: 'assistant', text: 'Mình chưa tải được feed đánh giá. Bạn thử làm mới dữ liệu rồi hỏi lại nhé.' })
    }
    if (!rankings.some((ranking) => ranking.posts.length > 0)) {
      return makeMessage({ role: 'assistant', text: 'Feed hiện chưa có bài đánh giá để mình thống kê.' })
    }

    return makeMessage({
      role: 'assistant',
      text: `Trong ${referenceData.posts.length} bài gần nhất mà feed trả về, đây là các bài dẫn đầu theo từng chỉ số:`,
      ...(rankings.length === 1 ? { posts: rankings[0].posts, metric: rankings[0].metric } : { postRankings: rankings }),
      note: 'Thống kê dựa trên counter hiện có; chưa phải bảng xếp hạng thịnh hành theo thời gian.',
    })
  }

  async function handleSend(rawText = input) {
    const query = rawText.trim()
    if (!query || isLoading) return

    setInput('')
    setMessages((current) => [...current, makeMessage({ role: 'user', text: query })])
    setIsLoading(true)

    try {
      // 1. Kiểm tra nếu câu hỏi thuần về tìm bài viết/bài đăng cộng đồng (local feed ranking)
      const isPostQuery = /bai viet|bai dang|luot tim|luot xem|binh luan/.test(normalizeText(query))
      if (isPostQuery) {
        const referenceData = didLoad.current ? data : await loadReferenceData()
        const postAnswer = createPostAnswer(query, referenceData)
        if (postAnswer) {
          setMessages((current) => [...current, postAnswer])
          setIsLoading(false)
          return
        }
      }

      // 2. Gửi câu hỏi đến Backend AI Model (Gemini / Groq / Fallback Engine)
      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const response = await chatboxApi.sendMessage({
        message: query,
        sessionId: currentSessionId || undefined,
        history: chatHistory,
      })

      if (response && response.reply) {
        if (response.sessionId) {
          if (response.sessionId !== currentSessionId) {
            setCurrentSessionId(response.sessionId)
          }
          void loadSessions()
        }
        const providerLabel = response.modelUsed ? ` · ${response.modelUsed}` : ''
        setMessages((current) => [
          ...current,
          {
            id: response.assistantMessageId || makeMessage({ role: 'assistant', text: '' }).id,
            role: 'assistant',
            text: response.reply,
            note: response.provider ? `Xử lý bởi AI: ${response.provider}${providerLabel}` : undefined,
          },
        ])
      } else {
        throw new Error('Không nhận được câu trả lời từ AI')
      }
    } catch (error: any) {
      console.error('Lỗi gọi AI Chatbox:', error)
      const errorMsg = error?.code === 'ECONNABORTED'
        ? 'Thời gian chờ AI phản hồi quá lâu (Timeout). Bạn vui lòng thử lại nhé!'
        : 'Không thể kết nối đến Trợ lý AI. Bạn hãy thử kiểm tra lại kết nối mạng hoặc thử lại sau nhé!'
      setMessages((current) => [
        ...current,
        makeMessage({
          role: 'assistant',
          text: errorMsg,
          note: 'Lỗi kết nối Trợ lý AI',
        }),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleSend()
  }

  function startCapture(frame: AssistantFrame) {
    navigate('/capture', { state: { initialFrameId: frame.id, initialFrame: frame } })
    setIsOpen(false)
  }

  function clearConversation() {
    setMessages([makeMessage({
      role: 'assistant',
      text: 'Mình sẵn sàng tư vấn frame, thông số và các bài đánh giá đang có nhiều tương tác. Bạn muốn xem gì trước?',
    })])
  }

  return (
    <div className="ai-assistant-root">
      {isOpen && (
        <section className={`ai-assistant-panel${isExpanded ? ' ai-assistant-panel--expanded' : ''}`} aria-label="KH AI Studio assistant">
          <header className="ai-assistant-header">
            <div className="ai-assistant-brandmark"><Bot size={21} strokeWidth={2.2} /><span className="ai-assistant-online-dot" /></div>
            <div className="ai-assistant-heading">
              <div className="ai-assistant-title-row"><strong>KH AI Studio</strong><span className="ai-assistant-version">GEMINI AI</span></div>
              <span className="ai-assistant-presence">AI Stylist &amp; Photobooth Copilot · Sẵn sàng</span>
            </div>
            <div className="ai-assistant-header-actions">
              <button
                type="button"
                onClick={() => void handleCreateNewSession()}
                title="Tạo hội thoại mới"
                aria-label="Tạo hội thoại mới"
                className="ai-assistant-icon-button"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                title={isExpanded ? 'Thu gọn (Ẩn danh sách)' : 'Mở rộng (Xem các đoạn hội thoại)'}
                aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                className="ai-assistant-icon-button ai-assistant-expand"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button type="button" onClick={() => setIsOpen(false)} title="Đóng chat" aria-label="Đóng chat" className="ai-assistant-icon-button"><X size={19} /></button>
            </div>
          </header>

          <div className="ai-assistant-body">
            {/* Sidebar danh sách đoạn hội thoại bên trái (khi mở rộng) */}
            {isExpanded && (
              <aside className="ai-assistant-sidebar">
                <div className="ai-assistant-sidebar-header">
                  <button
                    type="button"
                    className="ai-assistant-new-chat-btn"
                    onClick={() => void handleCreateNewSession()}
                  >
                    <Plus size={14} /> Đoạn chat mới
                  </button>
                </div>

                <div className="ai-assistant-sidebar-list">
                  {isAuthenticated ? (
                    sessions.length > 0 ? (
                      sessions.map((s) => (
                        <div
                          key={s.id}
                          className={`ai-assistant-session-item${s.id === currentSessionId ? ' ai-assistant-session-item--active' : ''}`}
                          onClick={() => void selectSession(s.id)}
                        >
                          <div className="ai-assistant-session-info">
                            <MessageSquare size={13} className="shrink-0 text-slate-400" />
                            <span className="ai-assistant-session-title" title={s.title}>
                              {s.title || 'Cuộc trò chuyện'}
                            </span>
                          </div>
                          <div className="ai-assistant-session-actions">
                            <button
                              type="button"
                              className="ai-assistant-session-delete-btn"
                              title="Xóa đoạn hội thoại"
                              onClick={(e) => void handleDeleteSingleSession(e, s.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Chưa có lịch sử hội thoại nào
                      </div>
                    )
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      <p className="mb-2">Đăng nhập để đồng bộ lịch sử hội thoại</p>
                      <button
                        type="button"
                        className="rounded bg-sky-600 px-2 py-1 text-xs text-white cursor-pointer"
                        onClick={() => navigate('/login')}
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  )}
                </div>

                {isAuthenticated && sessions.length > 0 && (
                  <div className="ai-assistant-sidebar-footer">
                    <button
                      type="button"
                      className="ai-assistant-clear-all-btn"
                      onClick={() => setIsClearAllModalOpen(true)}
                    >
                      <Trash2 size={13} /> Xóa toàn bộ lịch sử
                    </button>
                  </div>
                )}
              </aside>
            )}

            {/* Khung chat chính bên phải */}
            <main className="ai-assistant-main">
              <div className="ai-assistant-context">
                <Sparkles size={14} />
                <span>PHÂN TÍCH FRAME &amp; ĐÁNH GIÁ</span>
                <button type="button" onClick={() => void loadReferenceData()} disabled={isRefreshing} aria-label="Làm mới dữ liệu" title="Làm mới dữ liệu">
                  <RefreshCw size={13} className={isRefreshing ? 'ai-assistant-spin' : ''} />
                </button>
              </div>

              <div className="ai-assistant-messages" ref={scrollRef} aria-live="polite">
                {messages.map((message) => (
                  <div key={message.id} className={`ai-assistant-message ai-assistant-message--${message.role}`}>
                    {message.role === 'assistant' && <div className="ai-assistant-avatar"><Sparkles size={15} fill="currentColor" /></div>}
                    <div className="ai-assistant-message-content">
                      <div className="ai-assistant-bubble">
                        {message.role === 'assistant' ? (
                          <FormattedAiBubble text={message.text} />
                        ) : (
                          message.text
                        )}
                      </div>
                      {message.frames && (
                        <div className="ai-assistant-result-list">
                          {message.frames.map((frame, index) => (
                            <article className="ai-assistant-frame-card" key={frame.id}>
                              <img src={frame.thumbnail_url || frame.image_url} alt={frame.name} />
                              <div className="ai-assistant-card-copy">
                                <div className="ai-assistant-card-title"><span className="ai-assistant-rank">{index === 0 ? 'GỢI Ý' : `#${index + 1}`}</span><strong>{frame.name}</strong></div>
                                <span>{getFrameSlots(frame)} ảnh · {frame.width && frame.height ? `${frame.width} × ${frame.height} px` : frame.aspect_ratio || 'Kích thước chưa cập nhật'}</span>
                                <span className="ai-assistant-card-meta"><span className="ai-assistant-stars">★</span> {(frame.rating ?? 0).toFixed(1)} <span>·</span> {formatCount(frame.rating_count)} đánh giá{frame.usage_count ? ` · ${formatCount(frame.usage_count)} lượt dùng` : ''}</span>
                              </div>
                              <button type="button" className="ai-assistant-card-action" onClick={() => startCapture(frame)} aria-label={`Chọn frame ${frame.name}`} title="Chọn frame"><ChevronRight size={18} /></button>
                            </article>
                          ))}
                          {message.note && <p className="ai-assistant-data-note">{message.note}</p>}
                        </div>
                      )}
                      {message.posts && message.metric && (
                        <div className="ai-assistant-result-list">
                          {message.posts.map((post, index) => {
                            const metric = message.metric ?? 'likes_count'
                            const MetricIcon = metric === 'views_count' ? Eye : metric === 'comments_count' ? MessageCircle : Heart
                            return (
                              <button type="button" className="ai-assistant-post-card" key={post.id} onClick={() => navigate(`/reviews/${post.id}`)}>
                                <img src={post.cover_image_url || 'https://placehold.co/80x80/e9eef0/445?text=KH'} alt="Ảnh bài đánh giá" />
                                <span className="ai-assistant-post-copy"><strong><span className="ai-assistant-rank">#{index + 1}</span> {getPostAuthor(post)}</strong><span>{post.caption || 'Bài đánh giá của cộng đồng KH Booth'}</span><span className="ai-assistant-post-metric"><MetricIcon size={13} /> {formatCount(post[metric])} {metric === 'views_count' ? 'lượt xem' : metric === 'comments_count' ? 'bình luận' : 'lượt tim'}</span></span>
                                <ChevronRight size={17} className="ai-assistant-post-arrow" />
                              </button>
                            )
                          })}
                          {message.note && <p className="ai-assistant-data-note">{message.note}</p>}
                        </div>
                      )}
                      {message.postRankings && (
                        <div className="ai-assistant-result-list">
                          {message.postRankings.map(({ metric, posts }) => {
                            const MetricIcon = metric === 'views_count' ? Eye : metric === 'comments_count' ? MessageCircle : Heart
                            const metricLabel = metric === 'views_count' ? 'Lượt xem' : metric === 'comments_count' ? 'Bình luận' : 'Lượt tim'
                            return (
                              <section className="ai-assistant-ranking-group" key={metric}>
                                <h4><MetricIcon size={13} /> {metricLabel}</h4>
                                {posts.map((post, index) => (
                                  <button type="button" className="ai-assistant-post-card" key={post.id} onClick={() => navigate(`/reviews/${post.id}`)}>
                                    <img src={post.cover_image_url || 'https://placehold.co/80x80/e9eef0/445?text=KH'} alt="Ảnh bài đánh giá" />
                                    <span className="ai-assistant-post-copy"><strong><span className="ai-assistant-rank">#{index + 1}</span> {getPostAuthor(post)}</strong><span>{post.caption || 'Bài đánh giá của cộng đồng KH Booth'}</span><span className="ai-assistant-post-metric"><MetricIcon size={13} /> {formatCount(post[metric])} {metric === 'views_count' ? 'lượt xem' : metric === 'comments_count' ? 'bình luận' : 'lượt tim'}</span></span>
                                    <ChevronRight size={17} className="ai-assistant-post-arrow" />
                                  </button>
                                ))}
                              </section>
                            )
                          })}
                          {message.note && <p className="ai-assistant-data-note">{message.note}</p>}
                        </div>
                      )}
                    </div>

                    {/* Di chuột tới 3 chấm và bấm xóa tin nhắn */}
                    <div className="ai-assistant-message-actions">
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'delete-msg',
                              danger: true,
                              icon: <Trash2 size={13} />,
                              label: 'Xóa tin nhắn',
                              onClick: () => void handleDeleteSingleMessage(message.id),
                            },
                          ],
                        }}
                        trigger={['click']}
                        placement={message.role === 'user' ? 'bottomLeft' : 'bottomRight'}
                      >
                        <button
                          type="button"
                          className="ai-assistant-dot-btn"
                          title="Tùy chọn tin nhắn"
                          aria-label="Tùy chọn tin nhắn"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </Dropdown>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-assistant-thinking">
                    <span />
                    <span />
                    <span />
                    <small>AI đang suy nghĩ và phân tích kịch bản...</small>
                  </div>
                )}
              </div>

              {messages.length <= 2 && (
                <div className="ai-assistant-prompts" aria-label="Câu hỏi gợi ý">
                  {QUICK_PROMPTS.map(({ label, icon: Icon, prompt }) => (
                    <button type="button" key={label} onClick={() => void handleSend(prompt)}><Icon size={13} />{label}</button>
                  ))}
                </div>
              )}

              <form className="ai-assistant-composer" onSubmit={handleSubmit}>
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Hỏi về frame, số ảnh, kích thước..." aria-label="Nhập câu hỏi cho KH AI Studio" />
                <button type="submit" disabled={!input.trim() || isLoading} aria-label="Gửi câu hỏi" title="Gửi"><Send size={17} /></button>
              </form>
              <footer className="ai-assistant-footer"><span><span className="ai-assistant-footer-dot" /> Kết nối dữ liệu studio</span><span>KH AI · FE Preview</span></footer>
            </main>
          </div>

          {/* Modal xác nhận xóa toàn bộ */}
          <Modal
            title="Xóa toàn bộ lịch sử trò chuyện?"
            open={isClearAllModalOpen}
            onOk={() => void handleDeleteAllSessions()}
            onCancel={() => setIsClearAllModalOpen(false)}
            okText="Xóa tất cả"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            centered
          >
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử các cuộc hội thoại không? Thao tác này sẽ xóa vĩnh viễn tất cả tin nhắn trên tài khoản của bạn.
            </p>
          </Modal>
        </section>
      )}

      <button type="button" className={`ai-assistant-launcher${isOpen ? ' ai-assistant-launcher--hidden' : ''}`} onClick={() => setIsOpen(true)} aria-label="Mở KH AI Studio" title="Hỏi KH AI Studio">
        <span className="ai-assistant-launcher-icon"><Bot size={23} /></span>
        <span className="ai-assistant-launcher-label">Hỏi KH AI</span>
        <Sparkles size={15} className="ai-assistant-launcher-sparkle" />
      </button>
    </div>
  )
}