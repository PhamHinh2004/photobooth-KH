import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatboxService } from './chatbox.service';
import { CreateChatSessionDto, SendChatMessageDto } from './dto/chat-message.dto';
import { SuggestPoseDto } from './dto/suggest-pose.dto';
import { SuggestFrameDto } from './dto/suggest-frame.dto';
import { SuggestCaptionDto } from './dto/suggest-caption.dto';

@ApiTags('Chatbox AI')
@Controller('chatbox')
export class ChatboxController {
  constructor(private readonly chatboxService: ChatboxService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('message')
  @ApiOperation({
    summary: 'Gửi tin nhắn trò chuyện với Trợ lý AI Photobooth',
    description: 'Xử lý câu hỏi tự do, kết hợp tri thức thực tế về Frame trong hệ thống và cơ chế fallback đa model. Tự động lưu lịch sử theo tài khoản nếu đã đăng nhập.',
  })
  sendMessage(
    @Body() dto: SendChatMessageDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.chatboxService.handleChatMessage(dto, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'Lấy danh sách các phiên trò chuyện của tài khoản' })
  getSessions(@CurrentUser() user: { id: string }) {
    return this.chatboxService.getSessions(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  @ApiOperation({ summary: 'Tạo một phiên trò chuyện mới' })
  createSession(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chatboxService.createSession(user.id, dto.title);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id')
  @ApiOperation({ summary: 'Lấy chi tiết phiên trò chuyện kèm danh sách tin nhắn' })
  getSession(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.chatboxService.getSessionWithMessages(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Xóa 1 phiên trò chuyện lẻ' })
  deleteSession(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.chatboxService.deleteSession(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @ApiOperation({ summary: 'Xóa toàn bộ các phiên trò chuyện của tài khoản' })
  deleteAllSessions(@CurrentUser() user: { id: string }) {
    return this.chatboxService.deleteAllSessions(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('messages/:id')
  @ApiOperation({ summary: 'Xóa 1 tin nhắn lẻ' })
  deleteMessage(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.chatboxService.deleteMessage(id, user.id);
  }

  @Public()
  @Post('suggest-pose')
  @ApiOperation({
    summary: 'Gợi ý kịch bản tạo dáng (Posing Script) chi tiết theo Frame và số người',
    description: 'Sinh kịch bản chia theo từng lượt chụp (hiệp 1, hiệp 2), phân bổ vị trí từng người và style (vui vẻ, nghiêm túc, ngầu...).',
  })
  suggestPose(@Body() dto: SuggestPoseDto) {
    return this.chatboxService.suggestPose(dto);
  }

  @Public()
  @Post('suggest-frame')
  @ApiOperation({
    summary: 'Gợi ý Frame tối ưu nhất từ Database dựa trên số lượng người và concept',
    description: 'Phân tích tỷ lệ, số lượng slots, kích thước canvas để đưa ra lựa chọn ổn định nhất và lý do chi tiết.',
  })
  suggestFrame(@Body() dto: SuggestFrameDto) {
    return this.chatboxService.suggestFrame(dto);
  }

  @Public()
  @Post('suggest-caption')
  @ApiOperation({
    summary: 'Gợi ý Caption & Hashtags chia sẻ mạng xã hội',
    description: 'Sinh caption bắt trend Gen Z, hài hước, thả thính hoặc song ngữ.',
  })
  suggestCaption(@Body() dto: SuggestCaptionDto) {
    return this.chatboxService.suggestCaption(dto);
  }

  @Public()
  @Get('specs/:frameId')
  @ApiOperation({
    summary: 'Tra cứu thông số kỹ thuật và phân tích độ phù hợp của Frame',
    description: 'Bao gồm kích thước canvas, tỷ lệ aspect_ratio, tọa độ các slot, rating và đánh giá cho chụp đơn/nhóm.',
  })
  getFrameSpecs(@Param('frameId') frameId: string) {
    return this.chatboxService.getFrameSpecsAnalysis(frameId);
  }
}
