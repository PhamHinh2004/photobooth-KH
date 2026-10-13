// frames/entities/type-style.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Frame } from '../../frames/entities/frame.entity';

@Entity('type_style')
export class TypeStyle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  // 1 TypeStyle - n Frame
  @OneToMany(() => Frame, (frame) => frame.type_style)
  frames: Frame[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
