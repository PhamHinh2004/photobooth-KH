import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  recipient_account_id: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  actor_account_id?: string | null;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entity_type?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entity_id?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  action_url?: string | null;
}
