import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GifType {
  STANDARD = 'standard',
  BOOMERANG = 'boomerang',
}

@Entity('gifs')
export class Gif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GifType, default: GifType.STANDARD })
  gif_type: GifType;

  @Column({ type: 'varchar' })
  image_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
