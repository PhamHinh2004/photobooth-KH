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

  async validateUser(identifier: string, pass: string): Promise<Account | null> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .leftJoinAndSelect('account.customer', 'customer')
      .where('account.email = :identifier OR account.username = :identifier', {
        identifier,
      })
      .getOne();

    if (!account || !account.isActive) {
      return null;
    }

    const isMatch =  bcrypt.compare(pass, account.password as string);
    if (!isMatch) {
      return null;
    }

    delete (account as Partial<Account>).password;
    return account;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; account: Account }> {
    const account = await this.validateUser(dto.email, dto.password);
    if (!account) {
      throw new UnauthorizedException('Email/Username hoặc mật khẩu không chính xác');
    }

    const tokens = this.generateTokens(account);
    return {
      ...tokens,
      account,
    };
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; account: Account }> {
    const existingEmail = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const username = dto.username || dto.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);
    const existingUsername = await this.accountRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên người dùng (username) đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newAccount = this.accountRepository.create({
      email: dto.email,
      username,
      password: hashedPassword,
    });

    const savedAccount = await this.accountRepository.save(newAccount);

    const newCustomer = this.customerRepository.create({
      accountId: savedAccount.id,
      fullName: dto.fullName,
    });
    await this.customerRepository.save(newCustomer);

    const accountWithRelation = await this.accountsService.findOne(savedAccount.id || '');
    const tokens = this.generateTokens(accountWithRelation);

    return {
      ...tokens,
      account: accountWithRelation,
    };
  }

  private generateTokens(account: Account): { accessToken: string } {
    const payload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
