import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/account.entity';
import { Customer } from '../customers/entities/customer.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accountsService: AccountsService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Đăng ký tài khoản mới
   * @param dto
   * @returns
   */
  async register(dto: RegisterDto): Promise<{
    accessToken: string;
    user: { id: string; email: string; name: string; role: Role | undefined };
  }> {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingEmail = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const normalizedPhone = dto.phone.replace(/^\+84/, '0');
    const existingPhone = await this.customerRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (existingPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    // Username is kept for backward compatibility with the accounts schema.
    const username = dto.email.split('@')[0].slice(0, 140);
    const existingUsername = await this.accountRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên người dùng (username) đã tồn tại');
    }

    // 3. kiểm tra password có null không 
    if (!dto.password) {
      throw new ConflictException('Mật khẩu không được để trống');
    }
    // 4. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password || '', 10);

    // 5. Tạo và lưu Account
    const newAccount = this.accountRepository.create({
      email: dto.email,
      username,
      password: hashedPassword,
      role: Role.CUSTOMER,
      isActive: true,
      customer: { fullName: dto.fullName.trim(), phone: normalizedPhone },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedAccount = await this.accountRepository.save(newAccount);

    const payload = {
      sub: savedAccount.id || '',
      email: savedAccount.email || '',
      role: savedAccount.role || '',
    };
    const accessToken = this.jwtService.sign(payload as any);

    return {
      accessToken,
      user: {
        id: savedAccount.id || '',
        email: savedAccount.email || '',
        name: dto.fullName.trim(),
        role: savedAccount.role,
      },
    };
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: Role | undefined;
    };
  }> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .leftJoinAndSelect('account.customer', 'customer')
      .where('account.email = :identifier OR account.username = :identifier', {
        identifier: dto.email,
      })
      .getOne();

    if (!account || !account.isActive) {
      throw new UnauthorizedException('Email/Username hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, account.password as string);
    if (!isMatch) {
      throw new UnauthorizedException('Email/Username hoặc mật khẩu không chính xác');
    }

    // Tạo JWT Token
    const payload = {
      sub: account.id || '',
      email: account.email || '',
      role: account.role || '',
    };
    const accessToken = this.jwtService.sign(payload as any);

    return {
      accessToken,
      user: {
        id: account.id || '',
        email: account.email || '',
        name: account.customer?.fullName || account.username || account.email || '',
        role: account.role,
      },
    };
  }

  async getAccounts(): Promise<Account[]> {
    return this.accountRepository.find({
      where: {
        role: Role.CUSTOMER,
      },
    });
  }
}
