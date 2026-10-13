import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionTypeSupported, FrameAspectRatio } from '../entities/frame.entity';

export class CreateFrameDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(FrameAspectRatio)
  aspect_ratio?: FrameAspectRatio;

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

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' || value === 'null' ? undefined : value))
  type_style_id?: string;
}
