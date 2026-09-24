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

export enum FrameAspectRatio {
  GRID_2X2 = '2x2',
  STRIP_1X4 = '1x4',
  GRID_2X3 = '2x3',
  GRID_3X3 = '3x3', // Ghi là 3x3 nhưng layout có thể là 3x2
    GRID_3X2 = '3x2',
  GRID_4X2 = '4x2',
  GRID_2X4 = '2x4',
  GRID_2X4_VERTICAL = '2x4_vertical',
  GRID_2X4_HORIZONTAL = '2x4_horizontal',
  LAYOUT_5_3_2 = '5_3_2',
  LAYOUT_5_2_3 = '5_2_3',
  LAYOUT_7_4_3 = '7_4_3',
  LAYOUT_7_3_4 = '7_3_4',
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

  @Column({ type: 'enum', enum: FrameAspectRatio, nullable: true })
  aspect_ratio?: FrameAspectRatio;

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