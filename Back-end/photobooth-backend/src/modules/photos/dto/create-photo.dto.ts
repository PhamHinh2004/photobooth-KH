import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { MediaType, SessionType } from '../entities/photo.entity';

export class CreatePhotoDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  frameId?: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsEnum(SessionType)
  sessionType: SessionType;
}
