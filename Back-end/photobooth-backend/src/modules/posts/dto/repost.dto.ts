import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RepostDto {
  @ApiPropertyOptional({ description: 'Optional quote caption for the repost', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  quoteCaption?: string;
}
