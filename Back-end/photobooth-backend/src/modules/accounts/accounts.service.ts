import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(page = 1, limit = 10, role?: string, search?: string) {
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .orderBy('account.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (role) {
      query.andWhere('account.role = :role', { role });
    }

    if (search) {
      query.andWhere(
        '(account.email ILIKE :search OR account.username ILIKE :search OR customer.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: { customer: true },
    });

    if (!account) {
      throw new NotFoundException(`Tài khoản với ID ${id} không tồn tại`);
    }

    return account;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
      },
      relations: { customer: true },
    });
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    const existingEmail = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const existingUsername = await this.accountRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại trong hệ thống');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const account = this.accountRepository.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      role: dto.role,
    });

    const savedAccount = await this.accountRepository.save(account);

    // Tự động tạo customer profile nếu là tài khoản customer hoặc có truyền fullName
    if (dto.fullName || account.role === 'customer') {
      const customer = this.customerRepository.create({
        accountId: savedAccount.id,
        fullName: dto.fullName || dto.username,
      });
      await this.customerRepository.save(customer);
    }

    return this.findOne(savedAccount.id);
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    if (dto.email && dto.email !== account.email) {
      const existingEmail = await this.accountRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
      account.email = dto.email;
    }

    if (dto.role) {
      account.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      account.isActive = dto.isActive;
    }

    await this.accountRepository.save(account);
    return this.findOne(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const account = await this.accountRepository.findOne({
      where: { id },
      select: { id: true, password: true },
    });

    if (!account) {
      throw new NotFoundException(`Tài khoản không tồn tại`);
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, account.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    account.password = await bcrypt.hash(dto.newPassword, 10);
    await this.accountRepository.save(account);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const account = await this.findOne(id);
    await this.accountRepository.remove(account);
    return { message: 'Đã xóa tài khoản thành công' };
  }
}
