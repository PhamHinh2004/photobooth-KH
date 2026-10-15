# Spec — Chức năng đổi mật khẩu (Account)

## Bối cảnh

Áp dụng cho bảng `Account` (admin/staff đã đăng nhập). Người dùng đang đăng nhập tự đổi mật khẩu của chính mình — **không phải** flow "quên mật khẩu" (forgot password qua email, sẽ tách riêng nếu cần).

---

## 1. API Endpoint

### `PATCH /auth/change-password`

**Yêu cầu**: `@UseGuards(JwtAuthGuard)` — bắt buộc đã đăng nhập, lấy `accountId` từ `@CurrentUser()`, không truyền qua param/body để tránh user tự đổi mật khẩu của người khác.

### Request Body

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `currentPassword` | string | Có | Mật khẩu hiện tại, dùng để xác thực trước khi đổi |
| `newPassword` | string | Có | Mật khẩu mới, tối thiểu 8 ký tự |
| `confirmPassword` | string | Có | Phải khớp với `newPassword` |

```json
{
  "currentPassword": "MatKhauCu123",
  "newPassword": "MatKhauMoi456!",
  "confirmPassword": "MatKhauMoi456!"
}
```

### Response `200`

```json
{
  "message": "Đổi mật khẩu thành công"
}
```

### Response lỗi

| Status | Trường hợp |
|---|---|
| `400` | `newPassword` không đủ độ mạnh, hoặc `confirmPassword` không khớp `newPassword` |
| `401` | Chưa đăng nhập / token không hợp lệ, hoặc `currentPassword` sai |
| `422` | `newPassword` giống `currentPassword` (không cho đổi thành mật khẩu cũ) |

---

## 2. Quy tắc validate mật khẩu mới

- Tối thiểu **8 ký tự**
- Có ít nhất **1 chữ hoa, 1 chữ thường, 1 số**
- Khuyến nghị thêm: ít nhất 1 ký tự đặc biệt (tùy mức độ chặt bạn muốn áp dụng)
- **Không được giống** `currentPassword`

---

## 3. DTO

```typescript
// change-password.dto.ts
import { IsString, MinLength, Matches, Validate } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải có chữ hoa, chữ thường và số',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
```

---

## 4. Controller

```typescript
// auth.controller.ts
@UseGuards(JwtAuthGuard)
@Patch('change-password')
async changePassword(
  @CurrentUser() user: { id: string },
  @Body() dto: ChangePasswordDto,
) {
  return this.authService.changePassword(user.id, dto);
}
```

---

## 5. Service — logic xử lý

```typescript
// auth.service.ts
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';

async changePassword(accountId: string, dto: ChangePasswordDto) {
  const { currentPassword, newPassword, confirmPassword } = dto;

  if (newPassword !== confirmPassword) {
    throw new BadRequestException('Mật khẩu xác nhận không khớp');
  }

  const account = await this.accountRepository.findOne({ where: { id: accountId } });
  if (!account) {
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

  // Tùy chọn: revoke tất cả refresh token/session cũ để bắt đăng nhập lại ở thiết bị khác
  // await this.revokeAllSessions(accountId);

  return { message: 'Đổi mật khẩu thành công' };
}
```

---

## 6. Lưu ý bảo mật

- **Luôn hash mật khẩu** bằng `bcrypt` (hoặc `argon2`) trước khi lưu — không bao giờ lưu plain text, dù là mật khẩu cũ hay mới.
- **So sánh bằng `bcrypt.compare()`**, không so sánh chuỗi thường (`===`) vì `password` trong DB đã được hash.
- Sau khi đổi mật khẩu thành công, nên cân nhắc:
  - **Revoke refresh token cũ** — buộc đăng xuất khỏi các thiết bị/phiên khác, tránh trường hợp thiết bị bị đánh cắp mật khẩu vẫn còn đăng nhập
  - Gửi email/thông báo "Mật khẩu của bạn vừa được thay đổi" để người dùng phát hiện sớm nếu không phải họ tự đổi
- Không trả về bất kỳ thông tin nào về `password` (hash) trong response — chỉ trả `message` xác nhận thành công.

---

## 7. Test case cần kiểm tra

- [ ] Đổi mật khẩu thành công với dữ liệu hợp lệ → status `200`
- [ ] `currentPassword` sai → `401`
- [ ] `newPassword` không đủ 8 ký tự → `400`
- [ ] `newPassword` thiếu chữ hoa/số → `400`
- [ ] `confirmPassword` không khớp `newPassword` → `400`
- [ ] `newPassword` giống `currentPassword` → `422`
- [ ] Gọi API không kèm token → `401` (do `JwtAuthGuard` chặn)
- [ ] Sau khi đổi mật khẩu, thử đăng nhập lại bằng mật khẩu cũ → phải thất bại
- [ ] Sau khi đổi mật khẩu, đăng nhập bằng mật khẩu mới → phải thành công
