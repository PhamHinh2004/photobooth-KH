import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { roomsApi } from '../api/rooms.api';
import { Button, Typography, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getFrames } from '@/api/capture.api';
import type { Frame } from '@/types/capture.types';

const { Title, Text } = Typography;

export default function GroupFramePage() {
  const navigate = useNavigate();
  const { draft, selectedFrameId, setSelectedFrameId, setCurrentRoom } = useGroupCaptureStore();
  const [isCreating, setIsCreating] = useState(false);
  const [availableFrames, setAvailableFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFrames() {
      setIsLoading(true);
      try {
        const allFrames = (await getFrames()) as any[];
        const filtered = allFrames.filter(frame => 
          (frame.session_type_supported === 'both' || frame.session_type_supported === 'group') &&
          (!frame.supported_group_sizes || frame.supported_group_sizes.includes(draft.maxParticipants))
        );
        const finalFrames = filtered.length > 0 ? filtered : allFrames.filter(f => f.session_type_supported === 'both' || f.session_type_supported === 'group');
        setAvailableFrames(finalFrames);
        if (finalFrames.length > 0 && !finalFrames.find(f => f.id === selectedFrameId)) {
          setSelectedFrameId(finalFrames[0].id);
        }
      } catch (error) {
        message.error('Lỗi tải danh sách khung hình từ máy chủ');
      } finally {
        setIsLoading(false);
      }
    }
    loadFrames();
  }, [draft.maxParticipants]);

  const handleCreateRoom = async () => {
    if (!selectedFrameId) {
      message.error('Vui lòng chọn một khung hình');
      return;
    }

    try {
      setIsCreating(true);
      // 1. Create Room
      const room = await roomsApi.create({
        max_participants: draft.maxParticipants,
        countdown_seconds: 5 // Default for MVP
      });
      
      // 2. Select Frame
      await roomsApi.selectFrame(room.id, selectedFrameId);
      
      setCurrentRoom(room);
      message.success('Tạo phòng thành công!');
      navigate(`/group/${room.room_code}/lobby`);
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tạo phòng');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <Title level={2} className="!mb-2">Bước 2: Gợi Ý Khung Hình & Chọn Style</Title>
        <Text type="secondary">
          Dành riêng cho nhóm {draft.maxParticipants} người: Thuật toán bố cục tự động đề xuất tỷ lệ chuẩn nhất, tối ưu hiển thị.
        </Text>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <Title level={4} className="mb-4">Phần 1: Lựa Chọn Bố Cục Khung</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availableFrames.map(frame => (
            <div 
              key={frame.id}
              onClick={() => setSelectedFrameId(frame.id)}
              className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center
                ${selectedFrameId === frame.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-pink-300'}
              `}
            >
              <div className="font-bold mb-2 text-center">{frame.name || `Khung ${frame.id.substring(0, 8)}`}</div>
              <div className="text-xs text-gray-500 mb-4">{frame.layout_config.slots.length} Slot</div>
              
              {/* Frame Preview Image Container */}
              <div className={`w-full flex items-center justify-center min-h-[220px] aspect-[4/3] relative overflow-hidden mb-2 rounded-xl ${selectedFrameId === frame.id ? 'bg-white/80' : 'bg-gray-50'}`}>
                <img
                  src={frame.image_url || frame.thumbnail_url}
                  alt={frame.name}
                  className="max-h-full max-w-full object-contain drop-shadow-md rounded-sm transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = frame.thumbnail_url || frame.image_url || '';
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <Text type="secondary" className="block text-xs uppercase tracking-wide">Cấu hình đã chọn:</Text>
            <Text strong>Nhóm {draft.maxParticipants} người • Khung {selectedFrameId}</Text>
          </div>
          <div className="flex gap-4">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/group/new')}>
              Quay lại Bước 1
            </Button>
            <Button 
              type="primary" 
              size="large" 
              className="bg-teal-600 hover:bg-teal-700 min-w-[200px]"
              onClick={handleCreateRoom}
              disabled={!selectedFrameId || isCreating}
            >
              {isCreating ? <Spin size="small" className="mr-2" /> : null}
              KHỞI TẠO PHÒNG CHỤP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
