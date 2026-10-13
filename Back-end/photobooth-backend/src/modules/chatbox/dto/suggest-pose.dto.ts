import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ChatPoseStyle } from './chat-message.dto';

export class SuggestPoseDto {
  @ApiProperty({ description: 'ID của Frame được chọn hoặc tên tỷ lệ (vd: 4x2, 2x2, 1x4)' })
  @IsString()
  @IsNotEmpty()
  frameIdOrRatio: string;

  @ApiProperty({ description: 'Số lượng người chụp trong nhóm', default: 4, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  memberCount: number;

  @ApiPropertyOptional({ enum: ChatPoseStyle, description: 'Phong cách tạo dáng', default: ChatPoseStyle.VUI_VE })
  @IsOptional()
  @IsEnum(ChatPoseStyle)
  style?: ChatPoseStyle = ChatPoseStyle.VUI_VE;

  @ApiPropertyOptional({ description: 'Ghi chú thêm (vd: có đạo cụ kính râm, gấu bông, bạn nữ thấp hơn...)', example: 'Có mang theo kính râm và headband tai thỏ' })
  @IsOptional()
  @IsString()
  notes?: string;
}
