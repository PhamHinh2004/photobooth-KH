import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  fullName: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
