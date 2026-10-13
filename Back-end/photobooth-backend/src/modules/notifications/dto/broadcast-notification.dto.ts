import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class BroadcastNotificationDto {
  @ApiProperty({ description: 'Tiêu đề thông báo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết khi nhấn thông báo' })
  @IsString()
  @IsOptional()
  action_url?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Lọc theo role nhận (nếu để trống sẽ gửi cho tất cả)' })
  @IsEnum(Role)
  @IsOptional()
  targetRole?: Role;

  @ApiPropertyOptional({ description: 'ID tài khoản nhận cụ thể (nếu gửi đích danh 1 người)' })
  @IsUUID()
  @IsOptional()
  recipientAccountId?: string;
}
