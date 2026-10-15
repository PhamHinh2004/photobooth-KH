import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame, FrameAspectRatio, SessionTypeSupported } from '../frames/entities/frame.entity';
import { SendChatMessageDto } from './dto/chat-message.dto';
import { SuggestPoseDto } from './dto/suggest-pose.dto';
import { SuggestFrameDto } from './dto/suggest-frame.dto';
import { SuggestCaptionDto } from './dto/suggest-caption.dto';
import { AiProviderService, ChatMessagePayload } from './services/ai-provider.service';
import { PhotoboothKnowledgeService } from './services/photobooth-knowledge.service';

import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatMessageRole } from './entities/chat-message.entity';

@Injectable()
export class ChatboxService {
  private readonly logger = new Logger(ChatboxService.name);

  constructor(
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly aiProviderService: AiProviderService,
    private readonly knowledgeService: PhotoboothKnowledgeService,
  ) {}

  /**
   * Lấy danh sách các phiên trò chuyện của tài khoản
   */
  async getSessions(accountId: string) {
    return this.sessionRepository.find({
      where: { accountId },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Tạo phiên trò chuyện mới
   */
  async createSession(accountId: string, title?: string) {
    const session = this.sessionRepository.create({
      accountId,
      title: title?.trim() || 'Cuộc trò chuyện mới',
    });
    return this.sessionRepository.save(session);
  }

  /**
   * Lấy chi tiết phiên trò chuyện kèm toàn bộ tin nhắn
   */
  async getSessionWithMessages(sessionId: string, accountId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, accountId },
      relations: { messages: true },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hội thoại');
    }

    return session;
  }

  /**
   * Xóa 1 phiên trò chuyện lẻ
   */
  async deleteSession(sessionId: string, accountId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, accountId },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hội thoại');
    }

    await this.sessionRepository.remove(session);
    return { success: true, message: 'Đã xóa đoạn hội thoại' };
  }

  /**
   * Xóa toàn bộ các phiên trò chuyện của tài khoản
   */
  async deleteAllSessions(accountId: string) {
    await this.sessionRepository.delete({ accountId });
    return { success: true, message: 'Đã xóa toàn bộ lịch sử hội thoại' };
  }

  /**
   * Xóa 1 tin nhắn lẻ (khi di chuột vào 3 chấm và bấm xóa)
   */
  async deleteMessage(messageId: string, accountId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: { session: true },
    });

    if (!message || message.session?.accountId !== accountId) {
      throw new NotFoundException('Không tìm thấy tin nhắn hoặc bạn không có quyền xóa');
    }

    await this.messageRepository.remove(message);
    return { success: true, message: 'Đã xóa tin nhắn' };
  }

  /**
   * Xử lý tin nhắn chat tự do với khả năng suy nghĩ bằng AI Model và lưu lịch sử theo tài khoản
   */
  async handleChatMessage(dto: SendChatMessageDto, accountId?: string) {
    let selectedFrame: Frame | null = null;
    if (dto.frameId) {
      selectedFrame = await this.frameRepository.findOne({
        where: { id: dto.frameId, is_active: true },
      });
    }

    // Lấy danh sách khung ảnh đang active để nạp kiến thức thực tế (RAG Context)
    const activeFrames = await this.frameRepository.find({
      where: { is_active: true },
      take: 12,
      order: { sort_order: 'ASC' },
    });

    const framesSummary = activeFrames.map((f) => ({
      id: f.id,
      name: f.name,
      aspect_ratio: f.aspect_ratio,
      width: f.width,
      height: f.height,
      slots_count: f.layout_config?.slots?.length || 4,
      session_type: f.session_type_supported,
    }));

    // Xây dựng System Instruction chuyên biệt cho Photobooth AI
    const systemPrompt = `Bạn là "KH Booth AI Stylist" - Trợ lý thông minh cao cấp chuyên tư vấn cho phòng chụp ảnh Photobooth (tương tự phong cách Photobooth Hàn Quốc Life4Cuts, Haru Film).
Bạn có tư duy sâu sắc về nhiếp ảnh studio, bố cục khung hình, điều phối nhóm và nắm rõ tâm lý người chụp.

DỮ LIỆU CÁC FRAME THỰC TẾ TRONG HỆ THỐNG HIỆN TẠI:
${JSON.stringify(framesSummary, null, 2)}

${
  selectedFrame
    ? `FRAME NGƯỜI DÙNG ĐANG CHỌN:
Tên: ${selectedFrame.name} (ID: ${selectedFrame.id})
Kích thước canvas: ${selectedFrame.width}x${selectedFrame.height}px
Tỷ lệ: ${selectedFrame.aspect_ratio}
Số ô ảnh (slots): ${selectedFrame.layout_config?.slots?.length || 4} ô
Hỗ trợ phiên: ${selectedFrame.session_type_supported}`
    : 'Chưa chọn frame cụ thể.'
}

NGUYÊN TẮC TƯ VẤN & SUY NGHĨ:
1. Quy trình chụp đơn vs chụp nhóm:
   - Chụp đơn: Khuyên tập trung chân dung, thay đổi góc mặt (chính diện, nghiêng 45 độ, chụp cận), tay phụ hoạ tự nhiên, đổi dáng nhanh trong 3-5 giây.
   - Chụp nhóm (đặc biệt 3-6 người): Khuyên phân tầng độ cao (người ngồi trước, người đứng sau chếch vai vào tâm), hô nhịp 3-2-1 để cùng đổi dáng, chú ý không để tay hay đầu che mất mặt bạn bên cạnh.
2. Gợi ý Frame:
   - Chụp đơn / đôi: Ưu tiên Strip 1x4 hoặc Grid 2x2.
   - Chụp nhóm 4 người: Cực kỳ khuyến khích Grid 4x2 (8 ô chia 2 hiệp) hoặc Grid 3x2, 2x4. Giải thích rõ vì sao (đủ số lượng ô cho từng người tỏa sáng, slot rộng thoáng không bị ép khung).
3. Kịch bản Pose:
   - Khi được hỏi về cách pose (ví dụ 4 người với frame 4x2), hãy chia cụ thể:
     * Hiệp 1 (Shot 1 đến 4): Concept mở đầu, gắn kết, vị trí cụ thể ai ngồi ai đứng.
     * Hiệp 2 (Shot 5 đến 8): Concept bùng nổ, đổi chỗ, phụ kiện kính/mũ, phong cách theo yêu cầu (vui vẻ, nghiêm túc, ngầu...).
5. QUY TẮC ĐỊNH DẠNG & THẨM MỸ (BẮT BUỘC):
   - TUYỆT ĐỐI KHÔNG dùng bảng Markdown (| Cột 1 | Cột 2 |) vì khung chatbox nhỏ hẹp sẽ bị vỡ layout, tràn chữ và rất xấu.
   - TUYỆT ĐỐI KHÔNG dùng thẻ HTML như <br>, <b>, <span>.
   - Trình bày dạng danh sách từng Shot rõ ràng, thoáng mắt và thẩm mỹ:
     * Mỗi shot bắt đầu bằng tiêu đề rõ ràng: "📸 Shot 1: [Tên dáng]"
     * Bên dưới dùng các gạch đầu dòng ngắn gọn:
       - Tư thế: ...
       - Biểu cảm: ...
       - Mẹo nhỏ: ...
   - Phân đoạn bằng dòng trống để dễ đọc trên điện thoại và popup chat.
   - Ngắn gọn, súc tích, tinh tế, dùng emoji vừa phải, câu cú mượt mà chuẩn stylist chuyên nghiệp.`;

    let session: ChatSession | null = null;
    let userMsg: ChatMessage | null = null;

    if (accountId) {
      if (dto.sessionId) {
        session = await this.sessionRepository.findOne({
          where: { id: dto.sessionId, accountId },
        });
      }
      if (!session) {
        const autoTitle = dto.message.trim().slice(0, 45) || 'Cuộc trò chuyện mới';
        session = this.sessionRepository.create({
          accountId,
          title: autoTitle,
        });
        session = await this.sessionRepository.save(session);
      } else if (session.title === 'Cuộc trò chuyện mới') {
        const autoTitle = dto.message.trim().slice(0, 45);
        if (autoTitle) {
          session.title = autoTitle;
          await this.sessionRepository.save(session);
        }
      }

      // Lưu tin nhắn của user vào database
      userMsg = this.messageRepository.create({
        sessionId: session.id,
        role: ChatMessageRole.USER,
        content: dto.message,
      });
      await this.messageRepository.save(userMsg);
    }

    // Chuẩn bị tin nhắn hội thoại
    const messages: ChatMessagePayload[] = [];
    if (session) {
      // Lấy 6 tin nhắn trước đó của session (không bao gồm tin vừa lưu)
      const previousMessages = await this.messageRepository.find({
        where: { sessionId: session.id },
        order: { createdAt: 'DESC' },
        skip: 1,
        take: 6,
      });
      previousMessages.reverse().forEach((msg) => {
        messages.push({
          role: msg.role === ChatMessageRole.ASSISTANT ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    } else if (dto.history && dto.history.length > 0) {
      for (const item of dto.history.slice(-6)) {
        messages.push({
          role: item.role,
          content: item.content,
        });
      }
    }

    let userPromptWithContext = dto.message;
    if (dto.memberCount) {
      userPromptWithContext += `\n(Ngữ cảnh bổ sung: Số lượng người chụp là ${dto.memberCount} người)`;
    }
    if (dto.style) {
      userPromptWithContext += `\n(Phong cách mong muốn: ${dto.style})`;
    }
    if (dto.theme) {
      userPromptWithContext += `\n(Chủ đề/Sự kiện: ${dto.theme})`;
    }

    messages.push({
      role: 'user',
      content: userPromptWithContext,
    });

    // Gọi AI Provider với Multi-Model Fallback
    const aiResult = await this.aiProviderService.generateCompletionWithFallback(
      messages,
      systemPrompt,
    );

    let finalReply = '';
    let finalProvider = '';
    let finalModel = '';

    if (aiResult) {
      finalReply = aiResult.text;
      finalProvider = aiResult.provider;
      finalModel = aiResult.modelUsed;
    } else {
      // Fallback: Sử dụng Local Heuristic Engine nếu không có AI key hoặc tất cả AI models gặp lỗi rate limit
      finalReply = this.buildSmartFallbackResponse(dto, selectedFrame);
      finalProvider = 'local_fallback';
      finalModel = 'photobooth-expert-v1';
    }

    let assistantMsg: ChatMessage | null = null;
    if (session) {
      assistantMsg = this.messageRepository.create({
        sessionId: session.id,
        role: ChatMessageRole.ASSISTANT,
        content: finalReply,
        metadata: {
          provider: finalProvider,
          modelUsed: finalModel,
        },
      });
      await this.messageRepository.save(assistantMsg);

      await this.sessionRepository.update(session.id, {
        updatedAt: new Date(),
      });
    }

    return {
      success: true,
      reply: finalReply,
      provider: finalProvider,
      modelUsed: finalModel,
      sessionId: session?.id,
      userMessageId: userMsg?.id,
      assistantMessageId: assistantMsg?.id,
      context: {
        frameId: selectedFrame?.id,
        frameName: selectedFrame?.name,
        memberCount: dto.memberCount,
      },
    };
  }

  /**
   * Gợi ý kịch bản Pose chi tiết theo Frame và số người
   */
  async suggestPose(dto: SuggestPoseDto) {
    let frame: Frame | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      dto.frameIdOrRatio,
    );

    if (isUuid) {
      frame = await this.frameRepository.findOne({
        where: { id: dto.frameIdOrRatio },
      });
    }

    const ratioStr = frame?.aspect_ratio || dto.frameIdOrRatio || '4x2';

    // Thử tạo prompt chuyên sâu cho AI
    const systemPrompt = `Bạn là đạo diễn hình ảnh và Stylist chuyên nghiệp của Photobooth. Hãy xây dựng một kịch bản tạo dáng (Posing Script) hoàn chỉnh từng shot chụp.
Quy tắc:
- Số người: ${dto.memberCount} người
- Tỷ lệ khung: ${ratioStr} (Nếu 4x2 hoặc 2x4 thì là 8 shot chia làm 2 hiệp)
- Phong cách: ${dto.style || 'Vui vẻ'}
- Yêu cầu: Nêu rõ vị trí đứng/ngồi của từng bạn, biểu cảm mặt, cử chỉ tay và mẹo để không che khuất nhau.`;

    const aiResult = await this.aiProviderService.generateCompletionWithFallback(
      [
        {
          role: 'user',
          content: `Hãy lập kịch bản pose chi tiết cho nhóm ${dto.memberCount} người chụp với frame ${ratioStr}, phong cách ${dto.style}. ${dto.notes ? `Ghi chú thêm: ${dto.notes}` : ''}`,
        },
      ],
      systemPrompt,
    );

    const structuredFallback = this.knowledgeService.generatePoseScript(
      ratioStr,
      dto.memberCount,
      dto.style,
    );

    return {
      success: true,
      frame: frame ? { id: frame.id, name: frame.name, aspect_ratio: frame.aspect_ratio } : null,
      aiAnalysis: aiResult?.text || null,
      structuredScript: structuredFallback,
      provider: aiResult?.provider || 'local_fallback',
    };
  }

  /**
   * Gợi ý Frame phù hợp từ DB với phân tích lý do kỹ thuật
   */
  async suggestFrame(dto: SuggestFrameDto) {
    const qb = this.frameRepository.createQueryBuilder('frame').where('frame.is_active = true');

    if (dto.sessionType) {
      qb.andWhere(
        '(frame.session_type_supported = :st OR frame.session_type_supported = :both)',
        { st: dto.sessionType, both: SessionTypeSupported.BOTH },
      );
    }

    const activeFrames = await qb.orderBy('frame.rating', 'DESC').getMany();

    const analyzedFrames = activeFrames.map((frame) => {
      const analysis = this.knowledgeService.analyzeFrame(frame);
      let suitabilityScore = 7;
      let suitabilityReason = '';

      if (dto.memberCount === 1) {
        suitabilityScore = analysis.suitability.single.score;
        suitabilityReason = analysis.suitability.single.reason;
      } else if (dto.memberCount <= 3) {
        suitabilityScore = analysis.suitability.group2to3.score;
        suitabilityReason = analysis.suitability.group2to3.reason;
      } else {
        suitabilityScore = analysis.suitability.group4plus.score;
        suitabilityReason = analysis.suitability.group4plus.reason;
      }

      return {
        id: frame.id,
        name: frame.name,
        aspect_ratio: frame.aspect_ratio,
        image_url: frame.image_url,
        dimensions: { width: frame.width, height: frame.height },
        slotsCount: analysis.slotsCount,
        rating: frame.rating,
        suitabilityScore,
        suitabilityReason,
        recommendationNote: analysis.recommendationNote,
      };
    });

    // Sắp xếp theo điểm phù hợp nhất với số người
    analyzedFrames.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      success: true,
      memberCount: dto.memberCount,
      recommendedFrames: analyzedFrames.slice(0, 5),
      advice:
        dto.memberCount >= 4
          ? 'Đối với nhóm 4 người trở lên, các frame dạng lưới 4x2, 2x4 hoặc 3x2 là lựa chọn tối ưu nhất để tránh che mặt và tạo nhiều khoảnh khắc đáng nhớ.'
          : 'Đối với chụp đơn hoặc đôi bạn thân, các frame dải 1x4 (Strip) và lưới 2x2 vuông sẽ tôn trọn biểu cảm và góc mặt cận cảnh.',
    };
  }

  /**
   * Gợi ý Caption & Hashtags
   */
  async suggestCaption(dto: SuggestCaptionDto) {
    const systemPrompt = `Bạn là chuyên gia sáng tạo nội dung mạng xã hội (TikTok, Instagram, Threads, Facebook) chuyên về photobooth.
Hãy viết 3-4 captions cực chất, hấp dẫn theo chủ đề: "${dto.concept}", phong cách: ${dto.mood}.
Bao gồm cả phiên bản ngắn gọn, phiên bản hài hước/thả thính và bộ hashtags thịnh hành.`;

    const aiResult = await this.aiProviderService.generateCompletionWithFallback(
      [{ role: 'user', content: `Viết caption photobooth cho concept: ${dto.concept}, mood: ${dto.mood}, keywords: ${dto.keywords || 'không có'}` }],
      systemPrompt,
    );

    const fallbackCaptions = this.knowledgeService.generateCaptions(
      dto.concept,
      dto.mood,
      dto.memberCount,
    );

    return {
      success: true,
      aiCaptions: aiResult?.text || null,
      suggestedTemplates: fallbackCaptions.captions,
      provider: aiResult?.provider || 'local_fallback',
    };
  }

  /**
   * Tra cứu thông số chi tiết của Frame
   */
  async getFrameSpecsAnalysis(frameId: string) {
    const frame = await this.frameRepository.findOne({
      where: { id: frameId },
    });

    if (!frame) {
      throw new NotFoundException('Không tìm thấy khung ảnh');
    }

    const analysis = this.knowledgeService.analyzeFrame(frame);

    return {
      success: true,
      frame: {
        id: frame.id,
        name: frame.name,
        width: frame.width,
        height: frame.height,
        aspect_ratio: frame.aspect_ratio,
        session_type_supported: frame.session_type_supported,
        rating: frame.rating,
        slots: frame.layout_config?.slots || [],
      },
      analysis,
    };
  }

  /**
   * Tạo phản hồi thông minh cục bộ khi LLM không có API key hoặc gặp lỗi mạng
   */
  private buildSmartFallbackResponse(dto: SendChatMessageDto, frame: Frame | null): string {
    const msgLower = dto.message.toLowerCase();

    if (msgLower.includes('caption') || msgLower.includes('stt') || msgLower.includes('status')) {
      const caps = this.knowledgeService.generateCaptions(dto.message, undefined, dto.memberCount);
      return `### 📸 Gợi ý Caption Bắt Trend cho Bộ Ảnh:\n\n` +
        caps.captions.map((c, i) => `**${i + 1}. ${c.title}:**\n> "${c.text}"\n*Hashtags:* ${c.hashtags.join(' ')}\n`).join('\n');
    }

    if (msgLower.includes('pose') || msgLower.includes('dáng') || msgLower.includes('tạo dáng') || msgLower.includes('chụp')) {
      const ratio = frame?.aspect_ratio || (dto.memberCount && dto.memberCount >= 4 ? '4x2' : '2x2');
      const script = this.knowledgeService.generatePoseScript(ratio, dto.memberCount || 4, dto.style);

      return `### 🎬 ${script.title}\n\n` +
        `**Tổng quan:** ${script.overview}\n\n` +
        script.rounds.map(r => `#### 🌟 ${r.description}\n` +
          r.shots.map(s => `- **Shot ${s.shotNumber} (${s.poseName}):** ${s.instructions}\n  💡 *Mẹo:* ${s.tip}`).join('\n')
        ).join('\n\n') +
        `\n\n#### 📌 Lời khuyên chung:\n` + script.generalTips.map(t => `- ${t}`).join('\n');
    }

    if (msgLower.includes('frame') || msgLower.includes('khung') || msgLower.includes('chọn')) {
      return `### 🖼️ Tư vấn Chọn Khung Ảnh (Frame Advisor):\n\n` +
        `1. **Nếu bạn chụp 1 người (Đơn):**\n` +
        `   - Khuyên dùng: **Frame 1x4 (Strip)** hoặc **Frame 2x2 vuông**.\n` +
        `   - Lý do: Tôn cận cảnh gương mặt, dễ bắt trọn 4 góc mặt thần thái mà không bị loãng khung hình.\n\n` +
        `2. **Nếu chụp nhóm 4 người:**\n` +
        `   - Khuyên dùng: **Frame 4x2** (8 ô ảnh) hoặc **Frame 3x2** (6 ô).\n` +
        `   - Lý do: Với nhóm 4 người, Frame 4x2 cho phép chia làm 2 hiệp chụp (mỗi hiệp 4 shot). Cả 4 bạn có thể vừa chụp tập thể vừa chia cặp đôi 2-2 cực kỳ đa dạng và không lo bị che khuất mặt nhau!\n\n` +
        `Bạn có thể gửi ID frame cụ thể hoặc nhắn mình phong cách (vui vẻ, ngầu, nghiêm túc) để mình lên kịch bản chi tiết nhé!`;
    }

    return `Chào bạn! Mình là **KH Booth AI Stylist** 📸✨\n\n` +
      `Mình có thể hỗ trợ bạn:\n` +
      `- 🎯 **Tư vấn chọn Frame**: Chọn khung chuẩn cho chụp đơn hoặc nhóm 4 người (như Frame 4x2, 2x2, 1x4).\n` +
      `- 🕺 **Kịch bản Pose chi tiết**: Hướng dẫn tạo dáng từng shot theo lượt, phân công người ngồi/đứng theo style vui vẻ, ngầu hay nghiêm túc.\n` +
      `- ✍️ **Viết Caption & Hashtags**: Caption thả thính, hài hước, Gen Z cho bài đăng.\n` +
      `- 📐 **Phân tích thông số kỹ thuật Frame**: Chiều rộng, chiều cao, kích thước slot.\n\n` +
      `Bạn hãy thử hỏi: *"Gợi ý cho mình pose chụp nhóm 4 người với frame 4x2 style vui vẻ"* nhé!`;
  }
}
