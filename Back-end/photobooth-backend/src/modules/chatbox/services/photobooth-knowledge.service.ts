import { Injectable } from '@nestjs/common';
import { Frame, FrameAspectRatio, SessionTypeSupported } from '../../frames/entities/frame.entity';
import { ChatPoseStyle } from '../dto/chat-message.dto';
import { CaptionMood } from '../dto/suggest-caption.dto';

export interface FrameAnalysisResult {
  frameId: string;
  name: string;
  aspectRatio: string;
  dimensions: { width: number; height: number };
  slotsCount: number;
  sessionType: SessionTypeSupported;
  suitability: {
    single: { score: number; reason: string };
    group2to3: { score: number; reason: string };
    group4plus: { score: number; reason: string };
  };
  recommendationNote: string;
}

@Injectable()
export class PhotoboothKnowledgeService {
  /**
   * Phân tích chuyên sâu 1 Frame theo kích thước, số lượng slots và bố cục
   */
  analyzeFrame(frame: Frame): FrameAnalysisResult {
    const slotsCount = frame.layout_config?.slots?.length || 4;
    const ratio = frame.aspect_ratio || FrameAspectRatio.GRID_2X2;

    const result: FrameAnalysisResult = {
      frameId: frame.id,
      name: frame.name,
      aspectRatio: ratio,
      dimensions: { width: frame.width, height: frame.height },
      slotsCount,
      sessionType: frame.session_type_supported,
      suitability: {
        single: { score: 7, reason: 'Chụp đơn dễ dàng điều chỉnh' },
        group2to3: { score: 8, reason: 'Phù hợp nhóm nhỏ' },
        group4plus: { score: 6, reason: 'Cần chú ý góc đứng' },
      },
      recommendationNote: '',
    };

    if (ratio === FrameAspectRatio.STRIP_1X4) {
      result.suitability.single = {
        score: 10,
        reason: 'Khung dải 1x4 (Strip) kinh điển kiểu Hàn Quốc cực kỳ hợp chụp đơn hoặc đôi bạn thân, chụp nửa người/cận cảnh tôn trọn khuôn mặt.',
      };
      result.suitability.group4plus = {
        score: 4,
        reason: 'Khung 1x4 dọc có slot hẹp, nhóm 4 người sẽ phải đứng chen chúc dễ bị che mặt người đứng sau.',
      };
      result.recommendationNote = 'Phù hợp nhất: Chụp 1 người hoặc cặp đôi 2 người.';
    } else if (ratio === FrameAspectRatio.GRID_2X2) {
      result.suitability.single = {
        score: 9,
        reason: '4 ô vuông cân đối, chụp đơn thay đổi 4 góc mặt (nghiêng trái, nghiêng phải, chính diện, cười tươi) rất ấn tượng.',
      };
      result.suitability.group4plus = {
        score: 7,
        reason: 'Có thể chụp nhóm 4 người nếu chia đội hình 2 ngồi trước 2 đứng sau.',
      };
      result.recommendationNote = 'Khung quốc dân đa năng, phù hợp từ 1 đến 4 người.';
    } else if (ratio === FrameAspectRatio.GRID_4X2 || ratio === FrameAspectRatio.GRID_2X4 || ratio === FrameAspectRatio.GRID_2X4_HORIZONTAL || ratio === FrameAspectRatio.GRID_2X4_VERTICAL) {
      result.suitability.single = {
        score: 6,
        reason: '8 ô ảnh chụp đơn đòi hỏi bạn phải nghĩ nhiều pose liên tục để không bị lặp.',
      };
      result.suitability.group4plus = {
        score: 10,
        reason: 'Tuyệt phẩm cho nhóm từ 3 - 6 người! Bố cục 8 ô cho phép chia thành 2 hiệp chụp (mỗi hiệp 4 shot) giúp cả nhóm thỏa sức đổi concept và ai cũng có cơ hội nổi bật.',
      };
      result.recommendationNote = 'Số 1 cho hội bạn thân 4 người hoặc teambuilding kỷ niệm!';
    } else if (ratio === FrameAspectRatio.GRID_3X2 || ratio === FrameAspectRatio.GRID_2X3) {
      result.suitability.group4plus = {
        score: 9,
        reason: '6 ô ảnh có tỷ lệ khung hình thoáng đãng, dễ dàn hàng ngang 2 người trước 2 người sau mà không lo mất góc.',
      };
      result.recommendationNote = 'Rất cân đối và ổn định cho nhóm 3-5 bạn.';
    }

    return result;
  }

  /**
   * Sinh kịch bản Pose thông minh dựa trên tỷ lệ frame, số người và style
   */
  generatePoseScript(ratio: string, memberCount: number, style: ChatPoseStyle = ChatPoseStyle.VUI_VE): {
    title: string;
    overview: string;
    rounds: { roundNumber: number; description: string; shots: { shotNumber: number; poseName: string; instructions: string; tip: string }[] }[];
    generalTips: string[];
  } {
    const isSingle = memberCount === 1;
    const isGroup4 = memberCount >= 4;

    if (isSingle) {
      return {
        title: `Kịch bản Chụp Đơn - Phong cách ${this.getStyleLabel(style)}`,
        overview: 'Tập trung vào biểu cảm khuôn mặt, ánh mắt nhìn thẳng vào ống kính và các chuyển động tay tự nhiên.',
        rounds: [
          {
            roundNumber: 1,
            description: 'Khởi động với các góc mặt đẹp nhất (4 ảnh đầu)',
            shots: [
              { shotNumber: 1, poseName: 'Góc nghiêng 45 độ thanh lịch', instructions: 'Nghiêng mặt 45 độ sang hướng ánh sáng đẹp nhất, mắt nhìn ống kính, cười mỉm nhẹ.', tip: 'Hạ nhẹ cằm để đường viền hàm sắc nét hơn.' },
              { shotNumber: 2, poseName: 'Tay chạm má/tai e ấp', instructions: 'Dùng ngón tay chạm nhẹ gò má hoặc vén tóc, nụ cười tươi hở răng.', tip: 'Thả lỏng ngón tay, không ấn mạnh vào má.' },
              { shotNumber: 3, poseName: 'Nháy mắt winking & V-sign', instructions: 'Nháy một bên mắt, tay tạo chữ V nhỏ cạnh cằm phong cách idol Hàn.', tip: 'Giữ năng lượng tươi trẻ, tự nhiên.' },
              { shotNumber: 4, poseName: 'Bắn tim má (Cheek Heart)', instructions: 'Áp mu bàn tay làm nửa trái tim lên má, đầu hơi nghiêng nhẹ.', tip: 'Chớp mắt tự nhiên trước khi flash nháy.' },
            ],
          },
        ],
        generalTips: [
          'Giữ khoảng cách với camera khoảng 1.2m - 1.5m để tỷ lệ người cân đối.',
          'Nên hít thở sâu giữa các nhịp đếm ngược 5 giây để không bị mỏi cơ mặt.',
        ],
      };
    }

    // Nhóm 4 người hoặc nhiều hơn
    const is8Shots = ratio.includes('4x2') || ratio.includes('2x4') || ratio.includes('8');

    return {
      title: `Kịch bản Chụp Nhóm ${memberCount} người - Frame ${ratio} (${this.getStyleLabel(style)})`,
      overview: `Đối với nhóm ${memberCount} người và Frame ${ratio}, chìa khóa là phân tầng độ cao (Layering): 2 bạn ngồi ghế trước và 2 bạn đứng sau hơi nghiêng vai vào giữa để khung hình ấm cúng và không ai bị che khuất.`,
      rounds: [
        {
          roundNumber: 1,
          description: 'Hiệp 1: Đồng bộ và gắn kết (4 shot đầu)',
          shots: [
            {
              shotNumber: 1,
              poseName: 'Đội hình kim tự tháp (Gương mặt đại diện)',
              instructions: '2 bạn ngồi trước tựa vai nhau cười tươi; 2 bạn đứng sau tựa cằm lên vai hoặc đặt tay lên vai 2 bạn trước.',
              tip: 'Mọi người cùng nhìn thẳng vào lens máy ảnh, không nhìn màn hình preview.',
            },
            {
              shotNumber: 2,
              poseName: style === ChatPoseStyle.NGHIEM_TUC ? 'Thần thái Fashion Magazine' : 'Mỗi người một biểu cảm nhí nhảnh',
              instructions: style === ChatPoseStyle.NGHIEM_TUC 
                ? 'Mặt lạnh cool ngầu, khoanh tay hoặc chống cằm như bìa tạp chí, ánh mắt sắc sảo.'
                : 'Bạn 1 phồng má, bạn 2 bắn tim đôi, bạn 3 lè lưỡi tinh nghịch, bạn 4 làm mắt kính ngố.',
              tip: 'Giữ pose cố định trước khi countdown về 1 giây.',
            },
            {
              shotNumber: 3,
              poseName: 'Trái tim siêu to khổng lồ (Group Heart)',
              instructions: '2 bạn ngoài cùng dùng 1 tay tạo vòng cung nửa trái tim lớn; 2 bạn ở giữa chụm đầu bắn tim nhỏ trên đầu.',
              tip: 'Căn chỉnh tay không che mặt của bạn đứng cạnh.',
            },
            {
              shotNumber: 4,
              poseName: 'Nhìn nhau bật cười (Candid Moment)',
              instructions: 'Cả 4 bạn quay mặt nhìn nhau rồi cùng cười phá lên như vừa nghe một câu chuyện cười.',
              tip: 'Khoảnh khắc tự nhiên này luôn là tấm ảnh có hồn và được yêu thích nhất.',
            },
          ],
        },
        ...(is8Shots ? [{
          roundNumber: 2,
          description: 'Hiệp 2: Đổi vai trò hoặc sử dụng phụ kiện (4 shot sau)',
          shots: [
            {
              shotNumber: 5,
              poseName: 'Hoán đổi vị trí (Swap spots)',
              instructions: '2 bạn đứng chuyển sang ngồi, 2 bạn ngồi bước ra sau để tạo sự đa dạng.',
              tip: 'Thao tác đổi vị trí nhanh trong khoảng nghỉ giữa hiệp.',
            },
            {
              shotNumber: 6,
              poseName: 'Đeo kính râm / Phụ kiện tai thỏ',
              instructions: 'Cả nhóm cùng diện phụ kiện (kính đen ngầu hoặc bờm hoa/tai mèo).',
              tip: 'Tạo dáng "Swag" hoặc làm điệu theo phong cách Y2K.',
            },
            {
              shotNumber: 7,
              poseName: 'Bắt trọn góc mặt dìm hàng đáng yêu',
              instructions: '3 người cùng chỉ tay hoặc bất ngờ hướng mắt về 1 người (nhân vật chính của buổi tiệc/sinh nhật).',
              tip: 'Tạo cảm giác gắn kết đặc biệt cho nhóm bạn thân.',
            },
            {
              shotNumber: 8,
              poseName: 'Chào tạm biệt & Thả tim toàn màn hình',
              instructions: 'Cả 4 người cùng vẫy tay hoặc làm động tác high-five, nụ cười rạng rỡ nhất buổi chụp.',
              tip: 'Kỷ niệm tuyệt đẹp khép lại session photobooth.',
            },
          ],
        }] : []),
      ],
      generalTips: [
        'Mẹo căn khung: Người đứng sau nên nghiêng nhẹ thân mình khoảng 20 độ về phía trung tâm để lọt trọn vào khung slot.',
        'Đếm nhịp: 1 người trong nhóm giữ vai trò hô nhịp "3 - 2 - 1 Pose" để cả 4 người cùng đổi dáng đồng loạt.',
        'Ánh sáng: Tránh đứng quá sát mép ngoài photobooth vì ánh sáng đèn softbox sẽ không đều lên mặt.',
      ],
    };
  }

  /**
   * Sinh gợi ý Caption theo chủ đề và mood
   */
  generateCaptions(concept: string, mood: CaptionMood = CaptionMood.GEN_Z, memberCount = 4): {
    captions: { title: string; text: string; hashtags: string[] }[];
  } {
    const list: { title: string; text: string; hashtags: string[] }[] = [];

    switch (mood) {
      case CaptionMood.GEN_Z:
        list.push(
          {
            title: 'Gen Z Flexing',
            text: `Không có tiền thì chụp photobooth để lưu lại những ngày nghèo mà vui cùng mấy đứa này 📸✨ #VibeCheck`,
            hashtags: ['#photobooth', '#genz', '#besties', '#vibe', '#photoboothvn'],
          },
          {
            title: 'Bắt Trend Dễ Thương',
            text: `Uống nhầm một ánh mắt, cơn say theo cả đời. Mà đi nhầm vào booth này thì có ngay ảnh 10 điểm không có nhưng! 💅💫`,
            hashtags: ['#photostrip', '#cute', '#ootd', '#photoboothlife'],
          },
        );
        break;
      case CaptionMood.THA_THINH:
        list.push(
          {
            title: 'Thả Thính Ngọt Ngào',
            text: `Ảnh này có 4 ô, ô nào cũng có tớ, nhưng trong tim tớ chỉ có một ô dành cho cậu thôi. ❤️🎞️`,
            hashtags: ['#thathinh', '#photobooth', '#love', '#sweet'],
          },
          {
            title: 'Hẹn Hò Cuối Tuần',
            text: `Cuối tuần không hẹn với trà sữa, chỉ hẹn với người làm tim mình rung rinh trong photobooth. 🌸📸`,
            hashtags: ['#couplegoals', '#dateidea', '#photoboothkorea'],
          },
        );
        break;
      case CaptionMood.BAN_THAN:
        list.push(
          {
            title: 'Hội Bạn Thân Tri Kỷ',
            text: `Bạn thân là đứa cùng bạn chụp 7749 tấm ảnh dìm nhưng vẫn chọn bức đẹp nhất để in ra giữ trong ví. Mãi bên nhau bạn nhé! 👯‍♀️💖`,
            hashtags: ['#friendsforever', '#squadgoals', '#photostrip', '#kyyeu'],
          },
          {
            title: 'Nhóm Lầy Lội',
            text: `Đi chụp photobooth mà ngỡ như đi tấu hài. Đẹp thì ít mà hề hước thì có thừa! 😂🎉`,
            hashtags: ['#squad', '#bestfriends', '#funny', '#memories'],
          },
        );
        break;
      case CaptionMood.SONG_NGU:
        list.push(
          {
            title: 'Bilingual Aesthetic',
            text: `Collecting memories, one strip at a time. / Lưu giữ thanh xuân qua từng khung hình nhỏ. 🎞️✨`,
            hashtags: ['#photoboothmemories', '#aesthetic', '#polaroidvibe', '#youth'],
          },
          {
            title: 'Seoul Vibe',
            text: `Life is like a photobooth: smiling through the countdown! / Cuộc sống như photobooth, cứ đếm ngược là phải tươi! 🌟📸`,
            hashtags: ['#koreanphotobooth', '#lifourcuts', '#memories'],
          },
        );
        break;
      default:
        list.push({
          title: 'Kỷ Niệm Thanh Xuân',
          text: `Những khoảnh khắc đẹp nhất là khi ta ở cạnh nhau, nụ cười này xin gửi lại cho năm tháng. 🌸📸`,
          hashtags: ['#photobooth', '#memories', '#thanhxuan', '#happy'],
        });
    }

    return { captions: list };
  }

  private getStyleLabel(style: ChatPoseStyle): string {
    const map: Record<ChatPoseStyle, string> = {
      [ChatPoseStyle.VUI_VE]: 'Vui vẻ / Hài hước',
      [ChatPoseStyle.NGHIEM_TUC]: 'Nghiêm túc / Thần thái ngầu',
      [ChatPoseStyle.NANG_DONG]: 'Năng động / Tràn đầy năng lượng',
      [ChatPoseStyle.TINH_CAM]: 'Ấm áp / Tình cảm gắn kết',
      [ChatPoseStyle.GEN_Z]: 'Gen Z / Nhí nhảnh idol',
      [ChatPoseStyle.COOL_NGAC]: 'Cool ngầu / Swag Hiphop',
    };
    return map[style] || 'Vui vẻ';
  }
}
