export enum NotificationType {
  POST_COMMENTED = 'post_commented',
  COMMENT_REPLIED = 'comment_replied',
  POST_LIKED = 'post_liked',
  COMMENT_LIKED = 'comment_liked',
  POST_REPOSTED = 'post_reposted',
  ROOM_PARTICIPANT_JOINED = 'room_participant_joined',
  ROOM_COUNTDOWN_STARTED = 'room_countdown_started',
  GIFT_READY = 'gift_ready',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ADMIN_FEEDBACK_REPLIED = 'admin_feedback_replied',
}

export interface NotificationActor {
  id: string;
  username?: string;
  avatarUrl?: string | null;
  customer?: {
    fullName?: string | null;
    full_name?: string | null;
    image?: string | null;
  } | null;
}

export interface NotificationItem {
  id: string;
  recipient_account_id: string;
  actor_account_id: string | null;
  actor?: NotificationActor | null;
  type: NotificationType;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}
