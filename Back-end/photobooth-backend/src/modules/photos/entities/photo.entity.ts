import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Frame } from '../../frames/entities/frame.entity';

export enum PhotoType {
  CAPTURE = 'capture',
  FRAME_ASSET = 'frame_asset',
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
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

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: Account | null;

  @Column({ type: 'varchar', nullable: true })
  account_id: string | null;

  /** Phân loại ảnh: capture (chụp photobooth) hoặc frame_asset (ảnh idol/sticker tải lên trang trí frame) */
  @Column({ type: 'varchar', length: 50, default: PhotoType.CAPTURE })
  photo_type: string;

  /** Tên định danh của ảnh (VD: Tên Idol, nhãn dán, sticker) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  /** Phân loại chi tiết của asset: character, label, logo, sticker, gif, other */
  @Column({ type: 'varchar', length: 50, nullable: true })
  asset_category: string | null;

  /** Dữ liệu bổ sung dạng JSON (is_cutout, default_position, v.v.) */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => Frame, { nullable: true })
  @JoinColumn({ name: 'frame_id' })
  frame: Frame;

  @Column({ type: 'varchar', nullable: true })
  frame_id: string | null;

  @Column({ type: 'enum', enum: MediaType })
  media_type: MediaType;

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
