import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { roomsApi } from '../api/rooms.api';
import { useGroupCaptureStore } from '../store/roomStore';
import { RoomStatus } from '../types';

export default function GroupJoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { setCurrentRoom } = useGroupCaptureStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function joinRoom() {
      if (!code) return;
      try {
        const room = await roomsApi.getByCode(code);
        setCurrentRoom(room);
        
        // Try to join if not expired
        if (room.status === 'expired') {
          message.error('Phòng đã hết hạn');
          navigate('/group/new');
          return;
        }

        try {
          // Attempt to join API endpoint
          await roomsApi.join(room.id);
        } catch (e: any) {
          // Ignore if already joined, or handle error
          if (e.status !== 400 && e.status !== 403) {
            console.error('Join error:', e);
          }
        }
        
        // Redirect based on room status
        const statusMap: Record<RoomStatus, string> = {
          setup: `/group/${code}/lobby`,
          waiting: `/group/${code}/lobby`,
          countdown: `/group/${code}/studio`,
          capturing: `/group/${code}/studio`,
          post_production: `/group/${code}/result`,
          completed: `/group/${code}/result`,
          expired: '/group/new'
        };
        
        navigate(statusMap[room.status] || `/group/${code}/lobby`);
        
      } catch (error) {
        message.error('Không tìm thấy phòng hoặc lỗi kết nối');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    
    joinRoom();
  }, [code, navigate, setCurrentRoom]);

  return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <Spin size="large" />
      <div className="text-gray-500">Đang vào phòng...</div>
    </div>
  );
}
