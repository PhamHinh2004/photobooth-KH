import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomParticipant } from '../rooms/entities/room-participant.entity';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
  ) {}

  @OnEvent('comment.created')
  async onCommentCreated(comment: Comment) {
    try {
      if (!comment || !comment.post_id || !comment.account_id || (comment as any).type === 'like') return;

      const actorName = comment.account?.username || 'Một người dùng';

      // 1. Nếu là reply comment cha
      let parentCommentOwnerId: string | null = null;
      if (comment.parent_comment_id) {
        const parentComment = await this.commentRepository.findOne({
          where: { id: comment.parent_comment_id },
          relations: { account: true },
        });

        if (
          parentComment &&
          parentComment.account_id &&
          parentComment.account_id !== comment.account_id
        ) {
          parentCommentOwnerId = parentComment.account_id;
          await this.notificationsService.create({
            recipient_account_id: parentComment.account_id,
            actor_account_id: comment.account_id,
            type: NotificationType.COMMENT_REPLIED,
            title: 'Có câu trả lời mới',
            message: `${actorName} đã trả lời bình luận của bạn`,
            entity_type: 'comment',
            entity_id: comment.id,
            action_url: `/reviews/${comment.post_id}`,
          });
        }
      }

      // 2. Thông báo cho chủ Post (trừ khi chính chủ post tự comment hoặc đã nhận thông báo reply)
      const post = await this.postRepository.findOne({
        where: { id: comment.post_id },
      });

      if (post && post.account_id && post.account_id !== comment.account_id) {
        if (!parentCommentOwnerId || post.account_id !== parentCommentOwnerId) {
          await this.notificationsService.create({
            recipient_account_id: post.account_id,
            actor_account_id: comment.account_id,
            type: NotificationType.POST_COMMENTED,
            title: 'Có bình luận mới',
            message: `${actorName} đã bình luận về bài viết của bạn`,
            entity_type: 'post',
            entity_id: post.id,
            action_url: `/reviews/${post.id}`,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in onCommentCreated: ${err?.message}`, err?.stack);
    }
  }

  @OnEvent('post.liked')
  async onPostLiked(payload: {
    postId: string;
    accountId: string;
    likesCount: number;
    isLiked?: boolean;
  }) {
    try {
      // Chỉ tạo thông báo khi like (bỏ qua unlike)
      if (payload.isLiked === false) return;
      if (!payload.postId || !payload.accountId) return;

      const post = await this.postRepository.findOne({
        where: { id: payload.postId },
        relations: { account: true },
      });

      if (!post || !post.account_id) return;
      // Không tự thông báo cho chính mình
      if (post.account_id === payload.accountId) return;

      // Chống spam: Kiểm tra xem đã có thông báo like chưa đọc gần đây
      const existingUnread = await this.notificationRepository.findOne({
        where: {
          recipient_account_id: post.account_id,
          actor_account_id: payload.accountId,
          type: NotificationType.POST_LIKED,
          entity_id: post.id,
          is_read: false,
        },
      });

      if (existingUnread) {
        return;
      }

      await this.notificationsService.create({
        recipient_account_id: post.account_id,
        actor_account_id: payload.accountId,
        type: NotificationType.POST_LIKED,
        title: 'Lượt thích mới',
        message: 'đã thích bài viết của bạn',
        entity_type: 'post',
        entity_id: post.id,
        action_url: `/reviews/${post.id}`,
      });
    } catch (err: any) {
      this.logger.error(`Error in onPostLiked: ${err?.message}`, err?.stack);
    }
  }

  @OnEvent('comment.liked')
  async onCommentLiked(payload: {
    commentId: string;
    postId: string;
    accountId: string;
    likesCount: number;
    isLiked?: boolean;
  }) {
    try {
      if (payload.isLiked === false) return;
      if (!payload.commentId || !payload.accountId) return;

      const comment = await this.commentRepository.findOne({
        where: { id: payload.commentId },
      });

      if (!comment || !comment.account_id) return;
      if (comment.account_id === payload.accountId) return;

      const existingUnread = await this.notificationRepository.findOne({
        where: {
          recipient_account_id: comment.account_id,
          actor_account_id: payload.accountId,
          type: NotificationType.COMMENT_LIKED,
          entity_id: comment.id,
          is_read: false,
        },
      });

      if (existingUnread) {
        return;
      }

      const commentSnippet =
        comment.content && comment.content.length > 30
          ? `${comment.content.substring(0, 30)}...`
          : comment.content;

      await this.notificationsService.create({
        recipient_account_id: comment.account_id,
        actor_account_id: payload.accountId,
        type: NotificationType.COMMENT_LIKED,
        title: 'Lượt thích bình luận mới',
        message: commentSnippet
          ? `đã thích bình luận của bạn: "${commentSnippet}"`
          : 'đã thích bình luận của bạn',
        entity_type: 'comment',
        entity_id: comment.id,
        action_url: `/reviews/${comment.post_id}`,
      });
    } catch (err: any) {
      this.logger.error(`Error in onCommentLiked: ${err?.message}`, err?.stack);
    }
  }

  @OnEvent('post.reposted')
  async onPostReposted(payload: {
    postId: string;
    repostCount: number;
    accountId: string;
  }) {
    try {
      if (!payload.postId || !payload.accountId) return;

      const post = await this.postRepository.findOne({
        where: { id: payload.postId },
      });

      if (!post || !post.account_id) return;
      if (post.account_id === payload.accountId) return;

      await this.notificationsService.create({
        recipient_account_id: post.account_id,
        actor_account_id: payload.accountId,
        type: NotificationType.POST_REPOSTED,
        title: 'Bài viết được đăng lại',
        message: 'đã đăng lại bài viết của bạn',
        entity_type: 'post',
        entity_id: post.id,
        action_url: `/reviews/${post.id}`,
      });
    } catch (err: any) {
      this.logger.error(`Error in onPostReposted: ${err?.message}`, err?.stack);
    }
  }

  @OnEvent('room.participant_joined')
  async onRoomParticipantJoined(payload: {
    roomId: string;
    participant: RoomParticipant;
  }) {
    try {
      if (!payload?.roomId || !payload?.participant) return;

      const room = await this.roomRepository.findOne({
        where: { id: payload.roomId },
      });

      if (!room || !room.host_account_id) return;
      if (room.host_account_id === payload.participant.account_id) return;

      await this.notificationsService.create({
        recipient_account_id: room.host_account_id,
        actor_account_id: payload.participant.account_id,
        type: NotificationType.ROOM_PARTICIPANT_JOINED,
        title: 'Thành viên mới vào phòng',
        message: 'đã tham gia phòng chụp của bạn',
        entity_type: 'room',
        entity_id: room.id,
        action_url: `/group/${room.room_code}/lobby`,
      });
    } catch (err: any) {
      this.logger.error(
        `Error in onRoomParticipantJoined: ${err?.message}`,
        err?.stack,
      );
    }
  }

  @OnEvent('room.countdown_started')
  async onRoomCountdownStarted(payload: {
    roomId: string;
    roundIndex?: number;
    countdownSeconds?: number;
  }) {
    try {
      if (!payload?.roomId) return;
      // Chỉ thông báo ở hiệp đầu tiên (roundIndex === 0) để không spam mỗi hiệp chụp
      if (payload.roundIndex !== undefined && payload.roundIndex > 0) return;

      const room = await this.roomRepository.findOne({
        where: { id: payload.roomId },
      });
      if (!room) return;

      const participants = await this.roomParticipantRepository.find({
        where: { room_id: payload.roomId },
      });

      for (const p of participants) {
        if (p.account_id === room.host_account_id) continue;

        await this.notificationsService.create({
          recipient_account_id: p.account_id,
          actor_account_id: room.host_account_id,
          type: NotificationType.ROOM_COUNTDOWN_STARTED,
          title: 'Phòng chụp bắt đầu đếm ngược',
          message: 'Host đã bắt đầu phiên chụp ảnh, hãy chuẩn bị tạo dáng!',
          entity_type: 'room',
          entity_id: room.id,
          action_url: `/group/${room.room_code}/studio`,
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Error in onRoomCountdownStarted: ${err?.message}`,
        err?.stack,
      );
    }
  }

  @OnEvent('gift.ready')
  async onGiftReady(payload: {
    accountId: string;
    sessionId?: string;
    title?: string;
    message?: string;
  }) {
    try {
      if (!payload?.accountId) return;

      await this.notificationsService.create({
        recipient_account_id: payload.accountId,
        actor_account_id: null,
        type: NotificationType.GIFT_READY,
        title: payload.title || 'Quà tặng đã sẵn sàng!',
        message:
          payload.message ||
          'Quà tặng/voucher từ lượt chụp đã sẵn sàng để bạn nhận.',
        entity_type: 'gift',
        entity_id: payload.sessionId || null,
        action_url: payload.sessionId ? `/capture` : `/profile`,
      });
    } catch (err: any) {
      this.logger.error(`Error in onGiftReady: ${err?.message}`, err?.stack);
    }
  }
}
