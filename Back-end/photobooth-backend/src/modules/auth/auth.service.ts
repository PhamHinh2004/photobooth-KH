import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SafeUser, User } from './interfaces/user.interface';

// TODO: Thay thế bằng UserService + UserRepository thực khi có entity User
@Injectable()
export class AuthService {
  // Tạm thời dùng in-memory, thay bằng TypeORM repository sau
  private readonly users: User[] = [];

  constructor(private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = this.users.find((u) => u.email === email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _pwd, ...result } = user;
    return result;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.generateTokens(user);
  }

  async register(dto: RegisterDto): Promise<{ user: SafeUser; accessToken: string }> {
    const exists = this.users.find((u) => u.email === dto.email);
    if (exists) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser: User = {
      id: Date.now().toString(),
      email: dto.email,
      fullName: dto.fullName,
      password: hashedPassword,
    };

    this.users.push(newUser);
    const { password: _pwd, ...result } = newUser;

    return {
      user: result,
      ...this.generateTokens(result),
    };
  }

  private generateTokens(user: SafeUser): { accessToken: string } {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
