import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string | undefined;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string | undefined;

  @Column({ unique: true, type: 'varchar', length: 150 })
  username: string | undefined;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password: string | undefined;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role | undefined;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean | undefined;

  @OneToOne(() => Customer, (customer) => customer.account, { cascade: true })
  customer: Customer | undefined;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date | undefined;
}
