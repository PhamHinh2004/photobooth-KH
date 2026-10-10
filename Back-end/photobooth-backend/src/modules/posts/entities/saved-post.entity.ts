import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from './post.entity';

@Entity('saved_post')
@Unique(['post_id', 'account_id'])
export class SavedPost {
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

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
