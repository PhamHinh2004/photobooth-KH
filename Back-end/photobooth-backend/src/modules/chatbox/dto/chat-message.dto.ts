import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ChatPoseStyle {
  VUI_VE = 'vui_ve',
  NGHIEM_TUC = 'nghiem_tuc',
  NANG_DONG = 'nang_dong',
  TINH_CAM = 'tinh_cam',
  GEN_Z = 'gen_z',
  COOL_NGAC = 'cool_ngau',
}

export class ChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsEnum(['user', 'assistant', 'system'])
  role: 'user' | 'assistant' | 'system';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateChatSessionDto {
  @ApiPropertyOptional({ description: 'Tiêu đề cuộc trò chuyện', example: 'Gợi ý chụp 4 người' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'Câu hỏi hoặc yêu cầu của người dùng', example: 'Gợi ý cho mình pose chụp 4 người với frame 4x2 vui vẻ' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'ID của phiên trò chuyện (nếu có)' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'ID của Frame đang chọn (nếu có)' })
  @IsOptional()
  @IsString()
  frameId?: string;

  @ApiPropertyOptional({ description: 'Số lượng người chụp', default: 1, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  memberCount?: number;

  @ApiPropertyOptional({ enum: ChatPoseStyle, description: 'Phong cách mong muốn' })
  @IsOptional()
  @IsEnum(ChatPoseStyle)
  style?: ChatPoseStyle;

  @ApiPropertyOptional({ description: 'Chủ đề / Sự kiện (sinh nhật, tốt nghiệp, couple...)', example: 'kỷ niệm tốt nghiệp' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ type: [ChatHistoryItemDto], description: 'Lịch sử hội thoại trước đó để model nắm ngữ cảnh' })
  @IsOptional()
  @IsArray()
  history?: ChatHistoryItemDto[];
}
