import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum CaptionMood {
  THA_THINH = 'tha_thinh',
  HAI_HUOC = 'hai_huoc',
  GEN_Z = 'gen_z',
  BAN_THAN = 'ban_than',
  DE_THUONG = 'de_thuong',
  KY_NIEM = 'ky_niem',
  SONG_NGU = 'song_ngu',
}

export class SuggestCaptionDto {
  @ApiProperty({ description: 'Chủ đề hoặc câu chuyện của bức ảnh', example: 'Đi chụp photobooth kỷ niệm 4 năm bạn thân cùng nhau' })
  @IsString()
  concept: string;

  @ApiPropertyOptional({ enum: CaptionMood, description: 'Tone giọng điệu của Caption', default: CaptionMood.GEN_Z })
  @IsOptional()
  @IsEnum(CaptionMood)
  mood?: CaptionMood = CaptionMood.GEN_Z;

  @ApiPropertyOptional({ description: 'Số lượng người trong ảnh', default: 4, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  memberCount?: number;

  @ApiPropertyOptional({ description: 'Từ khóa hoặc chi tiết muốn có trong caption', example: 'quẩy hết mình, trà sữa, thanh xuân' })
  @IsOptional()
  @IsString()
  keywords?: string;
}
