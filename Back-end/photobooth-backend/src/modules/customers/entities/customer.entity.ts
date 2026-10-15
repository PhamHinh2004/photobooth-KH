import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Gender } from '../../../common/enums/gender.enum';
import { Account } from '../../accounts/entities/account.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string | undefined;

  @Column({ name: 'image', type: 'text', nullable: true })
  image: string | null | undefined;

  @OneToOne(() => Account, (account) => account.customer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: Account | undefined;

  @Column({ name: 'is_created', type: 'boolean', default: false })
  iscreated: boolean | undefined;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null | undefined;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null | undefined;

  @Column({ type: 'date', nullable: true })
  birthday: Date | string | null | undefined;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null | undefined;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHERS,
  })
  gender: Gender | undefined;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date | undefined;
}
