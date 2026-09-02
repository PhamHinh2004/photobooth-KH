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
  async register(dto: RegisterDto): Promise<Account> {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingEmail = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. kiểm tra username đã tồn tại chưa
    const existingUsername = await this.accountRepository.findOne({
      where: { username:dto.username },
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
      username:dto.username,
      password: hashedPassword,
      role: Role.CUSTOMER,
      isActive: true,
      customer:{
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedAccount = await this.accountRepository.save(newAccount);

    // 5. Trả về thông tin tài khoản đã tạo
    return this.accountsService.findOne(savedAccount.id || '');
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; account: Account }> {
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
      account,
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
