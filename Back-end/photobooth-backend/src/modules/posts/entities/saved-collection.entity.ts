import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  OneToMany, CreateDateColumn, JoinColumn, Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { SavedPost } from './saved-post.entity';

@Entity('saved_collection')
@Unique(['account_id', 'name'])
export class SavedCollection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column()
  account_id!: string;

  @Column({ length: 80 })
  name!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => SavedPost, (savedPost) => savedPost.collection)
  savedPosts!: SavedPost[];
}