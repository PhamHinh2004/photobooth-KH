import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RecordingStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  file_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.PROCESSING })
  status: RecordingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
