import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

@Entity('post_likes')
@Unique(['post_id', 'account_id'])
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  post_id: string;

  @Column()
  account_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
