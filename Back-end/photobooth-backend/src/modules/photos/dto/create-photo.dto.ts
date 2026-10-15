import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { MediaType } from '../entities/photo.entity';

export class CreatePhotoDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsUUID()
  frameId?: string;

  @IsEnum(MediaType)
  mediaType: MediaType;


}
