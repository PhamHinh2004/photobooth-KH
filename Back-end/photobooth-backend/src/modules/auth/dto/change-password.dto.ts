import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'MatKhauCu123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số)',
    example: 'MatKhauMoi456!',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải có chữ hoa, chữ thường và số',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu mới (phải trùng với newPassword)',
    example: 'MatKhauMoi456!',
  })
  @IsString()
  confirmPassword: string;
}
