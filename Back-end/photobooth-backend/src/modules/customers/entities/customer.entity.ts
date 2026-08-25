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
  id: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true, unique: true })
  accountId: string;

  @OneToOne(() => Account, (account) => account.customer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date | string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHERS,
  })
  gender: Gender;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
