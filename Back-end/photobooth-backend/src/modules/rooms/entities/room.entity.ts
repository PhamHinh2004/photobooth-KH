import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum RoomStatus {
  SETUP = 'setup',
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  CAPTURING = 'capturing',
  POST_PRODUCTION = 'post_production',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  room_code: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'host_account_id' })
  host: Account;

  @Column()
  host_account_id: string;

  @Column({ type: 'int' })
  max_participants: number;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.SETUP })
  status: RoomStatus;

  @Column({ type: 'int', default: 5 })
  countdown_seconds: number;

  @Column({ type: 'varchar', nullable: true })
  livekit_room_name: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamptz' })
  expires_at: Date;
}
