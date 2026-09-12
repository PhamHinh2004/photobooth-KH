import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('photo_sessions')
export class PhotoSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'session_type', type: 'varchar', length: 10 })
  sessionType!: 'solo' | 'group';

  @Column({ name: 'image_url', type: 'varchar', length: 1000 })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}