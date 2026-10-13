import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, Tooltip, Dropdown, type MenuProps, Spin } from 'antd';
import {
  Bell,
  Heart,
  MessageCircle,
  CornerDownRight,
  Repeat,
  Camera,
  Clock,
  Gift,
  Megaphone,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { NotificationType, type NotificationItem } from '@/types/notification.types';

// Helper tính khoảng thời gian tương đối giống Facebook
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} tuần trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// Icon nhỏ hiển thị góc dưới của Avatar theo kiểu Facebook
const getActionBadgeIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.POST_LIKED:
    case NotificationType.COMMENT_LIKED:
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Heart className="w-3 h-3 fill-white" />
        </div>
      );
    case NotificationType.POST_COMMENTED:
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <MessageCircle className="w-3 h-3 fill-white" />
        </div>
      );
    case NotificationType.COMMENT_REPLIED:
      return (
        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <CornerDownRight className="w-3 h-3" />
        </div>
      );
    case NotificationType.POST_REPOSTED:
      return (
        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Repeat className="w-3 h-3" />
        </div>
      );
    case NotificationType.ROOM_PARTICIPANT_JOINED:
      return (
        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Camera className="w-3 h-3" />
        </div>
      );
    case NotificationType.ROOM_COUNTDOWN_STARTED:
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Clock className="w-3 h-3" />
        </div>
      );
    case NotificationType.GIFT_READY:
      return (
        <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Gift className="w-3 h-3" />
        </div>
      );
    case NotificationType.SYSTEM_ANNOUNCEMENT:
    case NotificationType.ADMIN_FEEDBACK_REPLIED:
    default:
      return (
        <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm">
          <Megaphone className="w-3 h-3" />
        </div>
      );
  }
};

export const NotificationButton: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    page,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectSocket,
    disconnectSocket,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  // Khởi tạo kết nối Socket & dữ liệu thông báo
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      return;
    }

    connectSocket(token);
    fetchUnreadCount();
    fetchNotifications(1);

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications(1);
      fetchUnreadCount();
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.action_url) {
      navigate(item.action_url);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Lọc thông báo theo tab
  const displayedNotifications =
    filterTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  // Dropdown popover nội dung dạng Facebook
  const popoverContent = (
    <div className="w-[360px] sm:w-[410px] max-w-[92vw] bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col font-sans select-none">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold tracking-tight m-0 text-gray-900 dark:text-white">
            Thông báo
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {unreadCount} mới
            </span>
          )}
        </div>

        <Tooltip title="Đánh dấu tất cả là đã đọc">
          <button
            onClick={() => markAllAsRead()}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
          >
            <CheckCheck className="w-5 h-5 text-secondary" />
          </button>
        </Tooltip>
      </div>

      {/* Tabs lọc giống Facebook: Tất cả / Chưa đọc */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100/80 dark:border-neutral-800/60 bg-gray-50/50 dark:bg-neutral-900/40">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer border-0 ${
            filterTab === 'all'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-neutral-800'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterTab('unread')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
            filterTab === 'unread'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-neutral-800'
          }`}
        >
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                filterTab === 'unread'
                  ? 'bg-white text-secondary'
                  : 'bg-red-500 text-white'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Danh sách thông báo */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-neutral-800/40">
        {loading && notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Spin size="small" />
            <span className="text-xs">Đang tải thông báo...</span>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
              <Inbox className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 m-0">
              {filterTab === 'unread'
                ? 'Không có thông báo chưa đọc nào'
                : 'Bạn chưa có thông báo nào'}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-0 max-w-[240px]">
              Khi có người bình luận, like bài hoặc tham gia phòng chụp, bạn sẽ nhận được thông báo tại đây.
            </p>
          </div>
        ) : (
          displayedNotifications.map((item) => {
            const actorName =
              item.actor?.customer?.fullName ||
              item.actor?.customer?.full_name ||
              item.actor?.username ||
              'KH Booth';
            const avatarUrl =
              item.actor?.customer?.image || item.actor?.avatarUrl;

            const itemMenu: MenuProps['items'] = [
              {
                key: 'toggle-read',
                label: item.is_read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc',
                icon: <CheckCheck className="w-4 h-4" />,
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  markAsRead(item.id);
                },
              },
              {
                key: 'delete',
                label: 'Xóa thông báo này',
                danger: true,
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  deleteNotification(item.id);
                },
              },
            ];

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-100/80 dark:hover:bg-neutral-800/80 ${
                  !item.is_read
                    ? 'bg-blue-50/60 dark:bg-blue-950/20'
                    : 'bg-white dark:bg-[#242526]'
                }`}
              >
                {/* Avatar & Icon hành động Facebook style */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={actorName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-neutral-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {actorName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Icon huy hiệu ở góc dưới avatar */}
                  <div className="absolute -bottom-1 -right-1">
                    {getActionBadgeIcon(item.type)}
                  </div>
                </div>

                {/* Nội dung thông báo */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-[13.5px] leading-snug text-gray-800 dark:text-gray-200">
                    <span className="font-semibold text-gray-900 dark:text-white mr-1">
                      {actorName}
                    </span>
                    <span className={!item.is_read ? 'font-medium' : 'text-gray-600 dark:text-gray-300'}>
                      {item.message || item.title}
                    </span>
                  </div>

                  {/* Thời gian */}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs ${
                        !item.is_read
                          ? 'text-secondary font-semibold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                </div>

                {/* Chấm tròn xanh chưa đọc (FB style) & nút 3 chấm tuỳ chọn */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {!item.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-sm flex-shrink-0 animate-pulse" />
                  )}

                  <Dropdown
                    menu={{ items: itemMenu }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all cursor-pointer border-0 bg-transparent"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </Dropdown>
                </div>
              </div>
            );
          })
        )}

        {/* Nút xem thêm nếu còn trang */}
        {hasMore && displayedNotifications.length > 0 && (
          <div className="p-2 text-center bg-gray-50/50 dark:bg-neutral-900/30">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="text-xs font-semibold text-secondary hover:underline cursor-pointer border-0 bg-transparent py-1.5"
            >
              {loading ? 'Đang tải thêm...' : 'Xem thông báo cũ hơn'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0, borderRadius: 16 }}
      arrow={false}
    >
      <button
        aria-label="Thông báo"
        className={`relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-outline-variant bg-surface-container/60 hover:bg-surface-container hover:scale-105 active:scale-95 shadow-sm text-on-surface ${
          isOpen ? 'bg-secondary/20 ring-2 ring-secondary/30' : ''
        }`}
      >
        <Bell className="w-5 h-5 text-on-surface" />

        {/* Badge số lượng thông báo chưa đọc kiểu Facebook */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-900 pointer-events-none animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </Popover>
  );
};

export default NotificationButton;
