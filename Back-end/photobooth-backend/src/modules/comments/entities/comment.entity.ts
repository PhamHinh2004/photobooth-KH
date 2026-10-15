import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from '../../posts/entities/post.entity';

export enum CommentType {
  COMMENT = 'comment',
  LIKE = 'like',
}

@Entity('comments')
@Index(['post_id', 'type'])
@Index(['parent_comment_id', 'account_id', 'type'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'uuid' })
  post_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'uuid' })
  account_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_comment_id: string | null;

  @Column({ type: 'varchar', length: 20, default: CommentType.COMMENT })
  type: CommentType;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
