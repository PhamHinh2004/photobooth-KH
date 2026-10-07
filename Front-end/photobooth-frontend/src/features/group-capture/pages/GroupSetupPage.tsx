import { useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { Button, Input, Radio, Typography, Card } from 'antd';
import { ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function GroupSetupPage() {
  const navigate = useNavigate();
  const { draft, setDraft } = useGroupCaptureStore();

  const handleNext = () => {
    navigate('/group/new/frame');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <Title level={2} className="!mb-2">Bước 1: Thiết Lập Phòng Chụp Nhóm</Title>
        <Text type="secondary">
          Tạo không gian chụp ảnh trực tuyến đa góc máy thời gian thực. Mời nhóm bạn vào phòng chỉ với một cú nhấp!
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Form */}
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <Text strong className="text-lg block mb-2">1. Tên Phòng Chụp</Text>
            <Input 
              size="large"
              value={draft.name}
              onChange={(e) => setDraft({ name: e.target.value })}
              placeholder="Ví dụ: Hội Bạn Thân 2026 💖"
              maxLength={40}
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <Text strong className="text-lg">2. Số Lượng Thành Viên</Text>
              <Text type="secondary" className="text-sm">Hỗ trợ: 2 - 8 người</Text>
            </div>
            <Radio.Group 
              value={draft.maxParticipants} 
              onChange={(e) => setDraft({ maxParticipants: e.target.value })}
              className="w-full grid grid-cols-4 md:grid-cols-7 gap-2"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <Radio.Button 
                  key={num} 
                  value={num}
                  className={`text-center rounded-lg border flex flex-col items-center justify-center h-16 ${
                    draft.maxParticipants === num ? 'bg-pink-50 border-pink-500 text-pink-600' : ''
                  }`}
                >
                  <div className="font-bold text-lg">{num}</div>
                  <div className="text-xs">Người</div>
                </Radio.Button>
              ))}
            </Radio.Group>
            <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex gap-2">
              <span className="text-lg">💡</span>
              <span>Gợi ý thông minh: Với nhóm {draft.maxParticipants} người, bạn có thể chọn các bố cục có số lượng khung hình tương ứng.</span>
            </div>
          </div>

          <div>
            <Text strong className="text-lg block mb-2">3. Thời Gian Chờ Phòng (Lobby Timer)</Text>
            <Radio.Group 
              value={draft.lobbyMinutes}
              onChange={(e) => setDraft({ lobbyMinutes: e.target.value })}
              className="w-full flex gap-4"
            >
              <Radio value={2.0}>2 Phút</Radio>
              <Radio value={2.5}>2.5 Phút</Radio>
              <Radio value={3.0}>3 Phút</Radio>
            </Radio.Group>
            <Text type="secondary" className="text-xs block mt-2">
              🕒 Đồng hồ sẽ bắt đầu đếm ngược khi có người thứ 2 bước vào phòng
            </Text>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
            >
              Quay lại Trang Chủ
            </Button>
            <Button 
              type="primary" 
              size="large"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNext}
            >
              TIẾP TỤC: CHỌN KHUNG & STYLE (BƯỚC 2) <ArrowRightOutlined />
            </Button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <Card title="Mô phỏng phòng chờ" size="small" className="shadow-sm rounded-2xl bg-gray-50 border-0">
            <div className="grid grid-cols-2 gap-4 p-2">
              {Array.from({ length: draft.maxParticipants }).map((_, i) => (
                <div key={i} className="aspect-video bg-white rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-xs">Slot {i + 1}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
