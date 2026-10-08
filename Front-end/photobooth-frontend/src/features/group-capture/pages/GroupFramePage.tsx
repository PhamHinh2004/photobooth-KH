import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { roomsApi } from '../api/rooms.api';
import { Button, Typography, message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getFramesByAspectRatio } from '@/api/capture.api';
import type { Frame } from '@/types/capture.types';
import GroupCaptureProgress from '../components/GroupCaptureProgress';
import { getGroupFrameLayouts } from '../groupFrameLayouts';

const { Title, Text } = Typography;

export default function GroupFramePage() {
  const navigate = useNavigate();
  const { draft, selectedLayoutId, selectedFrameId, setSelectedFrameId, setCurrentRoom } = useGroupCaptureStore();
  const [isCreating, setIsCreating] = useState(false);
  const [availableFrames, setAvailableFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedLayout = getGroupFrameLayouts(draft.maxParticipants).find((layout) => layout.id === selectedLayoutId);

  useEffect(() => {
    const layoutId = selectedLayoutId;
    if (!layoutId) {
      navigate('/group/new/size', { replace: true });
      return;
    }

    let isCurrent = true;
    async function loadFrames() {
      setIsLoading(true);
      setAvailableFrames([]);
      try {
        const frames = await getFramesByAspectRatio(layoutId!);
        if (!isCurrent) return;
        const groupFrames = frames.filter((frame) => frame.session_type_supported === 'both' || frame.session_type_supported === 'group');
        setAvailableFrames(groupFrames);
        if (!groupFrames.some((frame) => frame.id === selectedFrameId)) {
          setSelectedFrameId(groupFrames[0]?.id ?? null);
        }
      } catch (error) {
        if (isCurrent) message.error('Lỗi tải danh sách style cho kích thước frame này');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }
    loadFrames();
    return () => {
      isCurrent = false;
    };
  }, [draft.maxParticipants, navigate, selectedFrameId, selectedLayoutId, setSelectedFrameId]);

  const handleCreateRoom = async () => {
    if (!selectedLayoutId || !selectedFrameId) {
      message.error('Vui lòng chọn một khung hình');
      return;
    }

    try {
      setIsCreating(true);
      // 1. Create Room
      const room = await roomsApi.create({
        name: draft.name.trim() || 'Phòng nhóm',
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
    <main className="mx-auto w-full max-w-[1220px] px-4 pb-32 pt-5 md:px-8 md:pt-8">
      <GroupCaptureProgress activeStep={2} />
      <header className="mb-7 text-center">
        <Title level={2} className="!mb-2">Bước 3: Chọn style frame</Title>
        <Text type="secondary">Style dành cho {selectedLayout?.title ?? selectedLayoutId} · nhóm {draft.maxParticipants} người</Text>
      </header>

      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white/80">
          <Spin size="large" />
          <Text type="secondary">Đang tải style frame...</Text>
        </div>
      ) : availableFrames.length === 0 ? (
        <div className="rounded-2xl border border-white bg-white/85 py-12 shadow-sm">
          <Empty description={`Chưa có style cho kích thước ${selectedLayoutId}. Hãy quay lại chọn kích thước khác.`}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/group/new/size')}>Quay lại chọn kích thước</Button>
          </Empty>
        </div>
      ) : (
        <section className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chọn họa tiết khung</h2>
              <p className="mt-1 text-sm text-slate-500">{availableFrames.length} style phù hợp với kích thước đã chọn</p>
            </div>
            <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">{selectedLayout?.slotsCount} ảnh / frame</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableFrames.map((frame) => {
              const isSelected = selectedFrameId === frame.id;
              return (
                <button
                  key={frame.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFrameId(frame.id)}
                  className={`rounded-2xl border-2 p-3 text-left transition ${isSelected ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md' : 'border-slate-200 bg-white hover:border-sky-300'}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold text-slate-900">{frame.name || `Style ${frame.id.slice(0, 8)}`}</span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${isSelected ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {isSelected ? 'ĐANG CHỌN' : `${frame.layout_config?.slots?.length ?? selectedLayout?.slotsCount ?? 0} ô`}
                    </span>
                  </div>
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-3">
                    <img
                      src={frame.image_url || frame.thumbnail_url}
                      alt={frame.name}
                      className="max-h-full max-w-full rounded object-contain"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_18px_rgba(0,0,0,0.08)] backdrop-blur md:p-4">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Text type="secondary" className="block text-[10px] uppercase tracking-wide">Đang thiết lập</Text>
            <Text strong className="block truncate">Nhóm {draft.maxParticipants} người · {selectedLayout?.title ?? selectedLayoutId}</Text>
          </div>
          <div className="flex w-full flex-row-reverse gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/group/new/size')}>Đổi kích thước</Button>
            <Button
              type="primary"
              size="large"
              className="!bg-teal-700 hover:!bg-teal-800"
              onClick={handleCreateRoom}
              disabled={!selectedFrameId || isLoading || availableFrames.length === 0 || isCreating}
            >
              {isCreating ? <Spin size="small" className="mr-2" /> : null}
              XÁC NHẬN STYLE & TẠO PHÒNG
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
