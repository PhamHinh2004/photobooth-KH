import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail,IsNotEmpty,IsOptional,IsString,MaxLength,MinLength } from 'class-validator';

export class RegisterDto {

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email?: string;

  @ApiPropertyOptional({ example: 'username123', description: 'Tên tài khoản (tùy chọn)' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;
}
