import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Photo } from '../../photos/entities/photo.entity';
import { Recording } from '../../recordings/entities/recording.entity';
import { Gif } from '../../gifs/entities/gif.entity';

export enum SessionType {
  SINGLE = 'single',
  GROUP = 'group',
}

export enum SessionResultStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('session_results')
export class SessionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SessionType })
  session_type: SessionType;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'uuid' })
  account_id: string;

  @OneToOne(() => Photo)
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;

  @Column({ type: 'uuid', nullable: true })
  photo_id: string;

  @OneToOne(() => Recording)
  @JoinColumn({ name: 'recording_id' })
  recording: Recording;

  @Column({ type: 'uuid', nullable: true })
  recording_id: string;

  @OneToOne(() => Gif)
  @JoinColumn({ name: 'gif_id' })
  gif: Gif;

  @Column({ type: 'uuid', nullable: true })
  gif_id: string;

  @Column({ type: 'enum', enum: SessionResultStatus, default: SessionResultStatus.PENDING })
  status: SessionResultStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
