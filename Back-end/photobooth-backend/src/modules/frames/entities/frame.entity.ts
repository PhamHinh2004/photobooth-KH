// frames/entities/frame.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum SessionTypeSupported {
  SINGLE = 'single',
  GROUP = 'group',
  BOTH = 'both',
}

@Entity('frame')
export class Frame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  image_url: string;

  @Column({ nullable: true })
  thumbnail_url?: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ nullable: true })
  aspect_ratio?: string;

  @Column({ type: 'enum', enum: SessionTypeSupported, default: SessionTypeSupported.BOTH })
  session_type_supported: SessionTypeSupported;

  @Column({ type: 'jsonb' })
  layout_config: {
    canvas_width: number;
    canvas_height: number;
    slots: { x: number; y: number; width: number; height: number }[];
  };

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: 0 })
  usage_count: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'created_by' })
  created_by: Account;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}