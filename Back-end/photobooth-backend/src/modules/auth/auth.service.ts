import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
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
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { RegistrationOtp } from './entities/registration-otp.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

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
    @InjectRepository(RegistrationOtp)
    private readonly registrationOtpRepository: Repository<RegistrationOtp>,
    private readonly configService: ConfigService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({
      where: { email },
    });

    if (!account?.id) {
      throw new BadRequestException('Email chưa tồn tại trong hệ thống');
    }

    const otp = randomInt(100000, 1000000).toString();
    await this.passwordResetRepository.delete({ accountId: account.id });
    await this.passwordResetRepository.save(
      this.passwordResetRepository.create({
        accountId: account.id,
        otpHash: this.hashValue(otp),
        resetTokenHash: null,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        verifiedAt: null,
        usedAt: null,
      }),
    );
    await this.sendOtpEmail(email, otp);
    return { message: 'Mã OTP đã được gửi. Mã có hiệu lực trong 2 phút.' };
  }

  async resendForgotPasswordOtp(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({ where: { email } });
    if (!account?.id) {
      throw new BadRequestException('Email chưa tồn tại trong hệ thống');
    }
    const current = await this.passwordResetRepository.findOne({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
    });
    if (current && Date.now() - current.createdAt.getTime() < 2 * 60 * 1000) {
      throw new BadRequestException('Bạn chỉ có thể gửi lại mã sau 2 phút');
    }
    return this.forgotPassword({ email });
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
      text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 2 phút.`,
      html: `<p>Mã OTP đặt lại mật khẩu của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong <strong>2 phút</strong>.</p>`,
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.replace(/^\+84/, '0');
    await this.ensureRegistrationAvailable(email, normalizedPhone);

    const otp = randomInt(100000, 1000000).toString();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.registrationOtpRepository.delete({ email });
    await this.registrationOtpRepository.save(
      this.registrationOtpRepository.create({
        email,
        fullName: dto.fullName.trim(),
        phone: normalizedPhone,
        passwordHash,
        otpHash: this.hashValue(otp),
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        lastSentAt: new Date(),
      }),
    );
    await this.sendRegistrationOtpEmail(email, otp);
    return { message: 'Mã OTP đã được gửi tới email của bạn. Mã có hiệu lực trong 2 phút.' };
  }

  async resendRegistrationOtp(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.replace(/^\+84/, '0');
    await this.ensureRegistrationAvailable(email, normalizedPhone);
    const pending = await this.registrationOtpRepository.findOne({ where: { email } });
    if (pending && Date.now() - pending.lastSentAt.getTime() < 2 * 60 * 1000) {
      throw new BadRequestException('Bạn chỉ có thể gửi lại OTP sau 2 phút');
    }
    return this.register(dto);
  }

  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const pending = await this.registrationOtpRepository.findOne({ where: { email } });
    if (!pending || pending.expiresAt < new Date() || !this.isHashMatch(dto.otp, pending.otpHash)) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }
    await this.ensureRegistrationAvailable(email, pending.phone);
    const username = email.split('@')[0].slice(0, 140);
    const account = await this.accountRepository.save(this.accountRepository.create({
      email,
      username,
      password: pending.passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      customer: { fullName: pending.fullName, phone: pending.phone },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await this.registrationOtpRepository.delete({ email });
    const accessToken = this.jwtService.sign({ sub: account.id || '', email, role: account.role || '' } as any);
    return {
      accessToken,
      user: { id: account.id || '', email, name: pending.fullName, role: account.role },
    };
  }

  private async ensureRegistrationAvailable(email: string, phone: string) {
    const existingEmail = await this.accountRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const existingPhone = await this.customerRepository.findOne({
      where: { phone },
    });
    if (existingPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const username = email.split('@')[0].slice(0, 140);
    const existingUsername = await this.accountRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên người dùng (username) đã tồn tại');
    }
  }

  private async sendRegistrationOtpEmail(email: string, otp: string): Promise<void> {
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
      subject: 'Mã OTP xác thực tài khoản Photobooth',
      text: `Mã OTP đăng ký Photobooth của bạn là ${otp}. Mã có hiệu lực trong 2 phút.`,
      html: `<p>Mã OTP đăng ký Photobooth của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong <strong>2 phút</strong>.</p>`,
    });
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

  async logout() {
    // Với JWT thông thường không lưu whitelist/blacklist, chỉ cần trả về thành công
    // Client sẽ tự xóa token ở frontend.
    return { message: 'Đăng xuất thành công' };
  }

  async getAccounts(): Promise<Account[]> {
    return this.accountRepository.find({
      where: {
        role: Role.CUSTOMER,
      },
    });
  }

  async changePassword(accountId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      select: { id: true, password: true },
    });

    if (!account || !account.password) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const isSameAsOld = await bcrypt.compare(newPassword, account.password);
    if (isSameAsOld) {
      throw new UnprocessableEntityException('Mật khẩu mới không được giống mật khẩu cũ');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedNewPassword;
    await this.accountRepository.save(account);

    return { message: 'Đổi mật khẩu thành công' };
  }
}
