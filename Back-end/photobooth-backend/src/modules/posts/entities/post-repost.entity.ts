import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from './post.entity';

@Entity('post_repost')
@Unique(['post_id', 'account_id'])
export class PostRepost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column()
  post_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: string;

  @Column({ type: 'text', nullable: true })
  quote_caption: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
