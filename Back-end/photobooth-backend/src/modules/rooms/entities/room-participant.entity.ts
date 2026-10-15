import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum ParticipantStatus {
  JOINED = 'joined',
  READY = 'ready',
  CAPTURED = 'captured',
  LEFT = 'left',
}

@Entity('room_participant')
@Unique(['room_id', 'slot_index'])
@Unique(['room_id', 'account_id'])
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  room_id: string;

  @Column()
  account_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ default: false })
  is_host: boolean;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.JOINED })
  status: ParticipantStatus;

  @Column({ type: 'int' })
  slot_index: number;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;
}
