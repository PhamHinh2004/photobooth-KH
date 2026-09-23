import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { GifType } from '../entities/gif.entity';

export class CreateGifDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsEnum(GifType)
  gifType?: GifType;
}
