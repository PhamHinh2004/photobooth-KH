import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsUUID()
  post_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;

  @ApiProperty()
  @IsString()
  content: string;
}
