import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/account.entity';
import { Customer } from '../customers/entities/customer.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums/role.enum';
import { PasswordReset } from './entities/password-reset.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accountsService: AccountsService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly configService: ConfigService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const account = await this.accountRepository.findOne({
      where: { email: dto.email },
    });

    if (account?.id) {
      const otp = randomInt(100000, 1000000).toString();
      await this.passwordResetRepository.delete({ accountId: account.id });
      await this.passwordResetRepository.save(
        this.passwordResetRepository.create({
          accountId: account.id,
          otpHash: this.hashValue(otp),
          resetTokenHash: null,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          verifiedAt: null,
          usedAt: null,
        }),
      );
      await this.sendOtpEmail(dto.email, otp);
    }

    return { message: 'Nếu email tồn tại, mã OTP đã được gửi.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const account = await this.accountRepository.findOne({ where: { email: dto.email } });
    const reset = account?.id
      ? await this.passwordResetRepository.findOne({
          where: { accountId: account.id },
          order: { createdAt: 'DESC' },
        })
      : null;

    if (
      !reset ||
      reset.usedAt ||
      reset.verifiedAt ||
      reset.expiresAt < new Date() ||
      !this.isHashMatch(dto.otp, reset.otpHash)
    ) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    const resetToken = randomBytes(32).toString('hex');
    reset.resetTokenHash = this.hashValue(resetToken);
    reset.verifiedAt = new Date();
    reset.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.passwordResetRepository.save(reset);

    return { message: 'Xác thực OTP thành công', resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const account = await this.accountRepository.findOne({ where: { email: dto.email } });
    const reset = account?.id
      ? await this.passwordResetRepository.findOne({
          where: { accountId: account.id },
          order: { createdAt: 'DESC' },
        })
      : null;

    if (
      !account?.id ||
      !reset ||
      reset.usedAt ||
      !reset.verifiedAt ||
      reset.expiresAt < new Date() ||
      !reset.resetTokenHash ||
      !this.isHashMatch(dto.resetToken, reset.resetTokenHash)
    ) {
      throw new BadRequestException('Reset token không hợp lệ hoặc đã hết hạn');
    }

    account.password = await bcrypt.hash(dto.newPassword, 10);
    await this.accountRepository.save(account);
    reset.usedAt = new Date();
    await this.passwordResetRepository.save(reset);

    return { message: 'Đặt lại mật khẩu thành công.' };
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private isHashMatch(value: string, hash: string): boolean {
    return this.hashValue(value) === hash;
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mail = this.configService.get('mail');
    if (!mail?.user || !mail.password) {
      throw new Error('Thiếu MAIL_USER hoặc MAIL_PASSWORD để gửi OTP');
    }

    const transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.password },
    });

    await transporter.sendMail({
      from: mail.from ?? mail.user,
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu Photobooth',
      text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `<p>Mã OTP đặt lại mật khẩu của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong 10 phút.</p>`,
    });
  }

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
