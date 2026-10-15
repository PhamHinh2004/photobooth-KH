import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

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

@Entity('notification')
@Index(['recipient_account_id', 'is_read', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Người nhận thông báo */
  @Column({ type: 'uuid' })
  recipient_account_id: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_account_id' })
  recipient: Account;

  /** Người gây ra hành động — null nếu là thông báo hệ thống (admin broadcast) */
  @Column({ type: 'uuid', nullable: true })
  actor_account_id: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_account_id' })
  actor: Account | null;

  @Column({ type: 'varchar', length: 50, default: NotificationType.POST_LIKED })
  type: NotificationType;

  /** Tiêu đề hiển thị */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /** Nội dung hiển thị */
  @Column({ type: 'text', nullable: true })
  message: string | null;

  /** Đối tượng liên quan — đa hình, không cố định FK sang 1 bảng duy nhất */
  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string | null; // 'post' | 'comment' | 'room' | 'gift' | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_id: string | null;

  /** Đường dẫn FE điều hướng khi bấm vào thông báo, vd "/reviews/abc-123" */
  @Column({ type: 'varchar', length: 500, nullable: true })
  action_url: string | null;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
