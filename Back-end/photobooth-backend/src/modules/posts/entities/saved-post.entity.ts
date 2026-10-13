import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Post } from './post.entity';
import { SavedCollection } from './saved-collection.entity';

@Entity('saved_post')
@Unique(['post_id', 'account_id'])
export class SavedPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @Column()
  post_id!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column()
  account_id!: string;

  @ManyToOne(() => SavedCollection, (collection) => collection.savedPosts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collection_id' })
  collection!: SavedCollection | null;

  @Column({ type: 'uuid', nullable: true })
  collection_id!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
