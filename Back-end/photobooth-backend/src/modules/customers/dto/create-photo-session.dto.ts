import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhotoSessionDto {
  @ApiProperty({ enum: ['solo', 'group'] })
  @IsIn(['solo', 'group'])
  sessionType!: 'solo' | 'group';

  @ApiProperty({ description: 'Ảnh URL hoặc data URL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Saturday night booth' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}