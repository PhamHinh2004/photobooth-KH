# Spec — OAuth2.0 Google & Facebook Login (NestJS + Passport)

## Bối cảnh

Cho phép `Account` đăng nhập bằng Google/Facebook thay vì chỉ email/password. Dùng `Passport.js` (chuẩn của NestJS cho OAuth), tích hợp chung với hệ thống JWT đã có (`JwtAuthGuard`, `@CurrentUser()`).

---

## 1. Cài đặt package

```bash
npm install @nestjs/passport passport passport-google-oauth20 passport-facebook
npm install -D @types/passport-google-oauth20 @types/passport-facebook
```

> Nếu đã có `@nestjs/jwt` + `passport-jwt` cho luồng login email/password thì không cần cài lại.

---

## 2. Cập nhật Entity `Account`

Cần phân biệt account đăng nhập bằng email/password thường và account đăng nhập qua OAuth. 2 hướng thiết kế:

### Hướng A — Thêm field trực tiếp vào `Account` (đơn giản, hợp đồ án)

```typescript
// accounts/entities/account.entity.ts
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

@Entity('account')
export class Account {
  // ... các field đã có (email, username, password, role, isActive...)

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  auth_provider: AuthProvider;

  /** ID do Google/Facebook cấp, null nếu là tài khoản local */
  @Column({ nullable: true })
  provider_id: string | null;

  @Column({ nullable: true })
  avatar_url: string | null;

  /** password nullable vì account OAuth không có mật khẩu */
  @Column({ nullable: true })
  password: string | null;
}
```

> **Lưu ý quan trọng**: `password` phải đổi thành `nullable: true` — vì account đăng nhập qua Google/Facebook không có mật khẩu. Nhớ cập nhật lại validate ở chức năng "Đổi mật khẩu" đã làm trước đó: chặn account có `auth_provider !== 'local'` không cho đổi mật khẩu (vì không có mật khẩu cũ để xác thực).

### Hướng B — Tách bảng `AccountOAuth` riêng (linh hoạt hơn nếu 1 account liên kết nhiều provider cùng lúc)

```typescript
@Entity('account_oauth')
@Unique(['provider', 'provider_id'])
export class AccountOAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  account_id: string;

  @Column({ type: 'enum', enum: AuthProvider })
  provider: AuthProvider;

  @Column()
  provider_id: string;

  @CreateDateColumn()
  created_at: Date;
}
```

**Khuyến nghị cho đồ án**: dùng **Hướng A** — đơn giản, đủ dùng, dễ giải trình. Chỉ cần Hướng B nếu yêu cầu "1 account vừa login Google vừa login Facebook, dùng chung 1 tài khoản".

---

## 3. Biến môi trường (`.env`)

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

FRONTEND_URL=http://localhost:5173
```

### Cách lấy Client ID/Secret

- **Google**: [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth Client ID → chọn "Web application" → thêm `GOOGLE_CALLBACK_URL` vào mục "Authorized redirect URIs"
- **Facebook**: [Facebook for Developers](https://developers.facebook.com) → tạo App → thêm sản phẩm "Facebook Login" → Settings → thêm `FACEBOOK_CALLBACK_URL` vào "Valid OAuth Redirect URIs"

---

## 4. Google Strategy

```typescript
// auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;
    const user = {
      providerId: id,
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos?.[0]?.value,
      provider: 'google',
    };
    done(null, user); // gắn vào req.user, xử lý tiếp ở Controller
  }
}
```

---

## 5. Facebook Strategy

```typescript
// auth/strategies/facebook.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID'),
      clientSecret: configService.get('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      profileFields: ['id', 'emails', 'name', 'photos'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    if (!emails?.[0]?.value) {
      return done(new Error('Facebook không trả về email. Vui lòng cấp quyền email khi đăng nhập.'), null);
    }

    const user = {
      providerId: id,
      email: emails[0].value,
      fullName: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
      avatarUrl: photos?.[0]?.value,
      provider: 'facebook',
    };
    done(null, user);
  }
}
```

> **Lưu ý**: Facebook **không phải lúc nào cũng trả về email** (nếu user chưa xác thực email trên Facebook, hoặc từ chối cấp quyền email) — code trên đã chặn sớm trường hợp này thay vì để lỗi khó hiểu về sau.

---

## 6. Service — xử lý logic "tìm hoặc tạo account"

```typescript
// auth/auth.service.ts (bổ sung thêm method)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Account, AuthProvider } from '../accounts/entities/account.entity';

interface OAuthUserPayload {
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider: 'google' | 'facebook';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(payload: OAuthUserPayload) {
    let account = await this.accountRepository.findOne({
      where: { email: payload.email },
    });

    if (!account) {
      // Chưa từng có tài khoản -> tạo mới
      account = await this.accountRepository.save({
        email: payload.email,
        username: payload.email.split('@')[0],
        full_name: payload.fullName,
        avatar_url: payload.avatarUrl,
        auth_provider: payload.provider as AuthProvider,
        provider_id: payload.providerId,
        password: null, // OAuth account không có password
        role: 'customer', // hoặc role mặc định phù hợp nghiệp vụ
        isActive: true,
      });
    } else if (account.auth_provider === AuthProvider.LOCAL) {
      // Email đã tồn tại dạng local (đăng ký bằng password trước đó)
      // -> liên kết thêm OAuth vào account cũ, KHÔNG tạo account trùng email
      account.auth_provider = payload.provider as AuthProvider;
      account.provider_id = payload.providerId;
      await this.accountRepository.save(account);
    }
    // Nếu account.auth_provider đã khớp provider hiện tại -> login bình thường, không cần update gì

    return this.generateTokens(account);
  }

  generateTokens(account: Account) {
    const payload = { sub: account.id, email: account.email, role: account.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      account: {
        id: account.id,
        email: account.email,
        fullName: account.full_name,
        avatarUrl: account.avatar_url,
        role: account.role,
      },
    };
  }
}
```

> **Điểm quan trọng**: xử lý case "email đã tồn tại dạng local" — tránh tạo ra 2 account trùng email (1 local, 1 OAuth), gây rối loạn dữ liệu và khó hiểu cho người dùng khi họ đăng nhập bằng cách khác nhau ở 2 lần khác nhau.

---

## 7. Controller

```typescript
// auth/auth.controller.ts (bổ sung thêm route)
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ==== GOOGLE ====
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirect sang Google — Guard tự xử lý, không cần code gì trong body
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.validateOAuthLogin(req.user);
    this.redirectWithTokens(res, tokens);
  }

  // ==== FACEBOOK ====
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.validateOAuthLogin(req.user);
    this.redirectWithTokens(res, tokens);
  }

  private redirectWithTokens(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    // Redirect về FE kèm token qua query param (FE tự lưu vào localStorage rồi xoá khỏi URL)
    res.redirect(
      `${frontendUrl}/oauth-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }
}
```

---

## 8. Module

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtStrategy } from './strategies/jwt.strategy'; // đã có sẵn cho JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy, JwtStrategy],
})
export class AuthModule {}
```

---

## 9. Frontend — luồng xử lý

### Bước 1 — Nút đăng nhập, redirect thẳng sang backend

```tsx
function LoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      <a href="http://localhost:3000/auth/google" className="btn-google">
        Đăng nhập với Google
      </a>
      <a href="http://localhost:3000/auth/facebook" className="btn-facebook">
        Đăng nhập với Facebook
      </a>
    </div>
  );
}
```

> Đây **không phải** `fetch()`/`axios` — là link điều hướng trình duyệt thật (`<a href>`), vì OAuth cần redirect qua trang đăng nhập của Google/Facebook, không thể gọi bằng AJAX.

### Bước 2 — Trang `/oauth-callback` nhận token, lưu và điều hướng vào app

```tsx
// pages/oauth-callback.tsx
function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      router.replace('/'); // xoá query param khỏi URL, vào trang chính
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, []);

  return <div>Đang đăng nhập...</div>;
}
```

---

## 10. Lưu ý bảo mật

- **Không trả token trực tiếp trong JSON response của `callback` endpoint** — vì đây là redirect từ Google/Facebook, response này không dành cho JS đọc trực tiếp. Truyền qua query param khi redirect về FE (như code trên) là cách chuẩn.
- Sau khi FE đọc token từ URL xong, **phải xoá query param khỏi URL** (dùng `router.replace`) — tránh token bị lưu lại trong lịch sử trình duyệt/bị lộ khi share link.
- Cân nhắc dùng `state` parameter của OAuth2.0 để chống CSRF nếu triển khai kỹ hơn (không bắt buộc cho đồ án, nhưng nên biết để trả lời nếu hội đồng hỏi).
- Với account tạo qua OAuth, `password = null` — nhớ kiểm tra ở API "Đổi mật khẩu" đã làm trước đó: chặn user OAuth gọi API này (vì không có `currentPassword` để xác thực), hướng dẫn họ đặt mật khẩu mới qua flow riêng nếu muốn vừa OAuth vừa login bằng password.

---

## 11. Checklist

- [ ] `GET /auth/google` → redirect đúng sang trang đăng nhập Google
- [ ] Đăng nhập Google thành công → redirect về `FRONTEND_URL/oauth-callback` kèm token
- [ ] Email Google trùng với 1 account local đã có sẵn → **không tạo account mới**, liên kết vào account cũ
- [ ] Đăng nhập Facebook mà user từ chối cấp quyền email → backend trả lỗi rõ ràng, không crash
- [ ] Token nhận được từ callback dùng gọi `GET /accounts/me` thành công (đúng luồng `JwtAuthGuard` đã có)
- [ ] Account tạo qua OAuth có `password = null`, gọi API đổi mật khẩu → trả lỗi phù hợp thay vì lỗi hệ thống khó hiểu
- [ ] Test đăng nhập lại lần 2 với cùng tài khoản Google → không tạo thêm account trùng, chỉ cấp token mới
