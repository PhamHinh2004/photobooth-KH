import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionTypeSupported } from '../entities/frame.entity';

export class CreateFrameDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  aspect_ratio?: string;

  @IsOptional()
  @IsEnum(SessionTypeSupported)
  session_type_supported?: SessionTypeSupported = SessionTypeSupported.BOTH;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  sort_order?: number = 0;

  // Gửi dạng JSON string, parse trong Controller
  @IsString()
  layout_config: string;
}
