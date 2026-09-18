import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Frame } from '../../frames/entities/frame.entity';

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
}

export enum SessionType {
  SINGLE = 'single',
  GROUP = 'group',
}

export enum PhotoStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('photo')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: string;

  @ManyToOne(() => Frame, { nullable: true })
  @JoinColumn({ name: 'frame_id' })
  frame: Frame;

  @Column({ type: 'varchar', nullable: true })
  frame_id: string | null;

  @Column({ type: 'enum', enum: MediaType })
  media_type: MediaType;

  @Column({ type: 'enum', enum: SessionType })
  session_type: SessionType;

  /** Mảng asset_id (icon/filter) đã áp dụng, lưu dạng jsonb */
  @Column({ type: 'jsonb', nullable: true })
  filters_applied: string[] | null;

  /** Ảnh gốc chưa ghép frame — giữ lại để cho phép đổi frame/re-edit sau này */
  @Column()
  original_file_url: string;

  /** Ảnh đã ghép frame hoàn chỉnh — null trong lúc đang xử lý (status = processing) */
  @Column({ type: 'varchar', nullable: true })
  processed_file_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'enum', enum: PhotoStatus, default: PhotoStatus.PROCESSING })
  status: PhotoStatus;

  /** Chỉ có giá trị khi media_type = video */
  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  /** Dùng cho QR share link, unique + indexed */
  @Column({ unique: true })
  share_token: string;

  @Column({ default: 0 })
  download_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
