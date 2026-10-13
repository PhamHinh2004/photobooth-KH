import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SessionTypeSupported } from '../../frames/entities/frame.entity';

export class SuggestFrameDto {
  @ApiProperty({ description: 'Số lượng người chụp', default: 4, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  memberCount: number;

  @ApiPropertyOptional({ enum: SessionTypeSupported, description: 'Hình thức chụp (single, group, both)' })
  @IsOptional()
  @IsEnum(SessionTypeSupported)
  sessionType?: SessionTypeSupported;

  @ApiPropertyOptional({ description: 'Chủ đề buổi chụp (vd: sinh nhật, kỷ niệm yêu nhau, giáng sinh, hội bạn thân...)', example: 'hội bạn thân 4 người kỷ niệm ra trường' })
  @IsOptional()
  @IsString()
  conceptOrTheme?: string;
}
