import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Check
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { SessionResult } from '../../session-results/entities/session-result.entity';

export enum PostStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('posts')
@Check(`"rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)`)
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  @ManyToOne(() => SessionResult)
  @JoinColumn({ name: 'session_id' })
  session: SessionResult;

  @Column()
  session_id: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ type: 'jsonb', nullable: true })
  style_tags: string[] | null;

  @Column({ type: 'double precision', nullable: true })
  rating: number | null;

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
