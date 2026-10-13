import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import type { Participant } from '../types';
import { connectRoomSocket } from '../realtime/roomSocket';
import { joinLivekit } from '../media/useLiveKitRoom';
import { roomsApi } from '../api/rooms.api';
import { Button, Typography, message, Card, Switch, Modal, Spin } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import GroupCaptureProgress from '../components/GroupCaptureProgress';
import { Room } from '../types';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { LiveKitRoom, ParticipantTile, useTracks } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { QRCodeSVG } from 'qrcode.react';

const { Title, Text } = Typography;

function LobbyStage({ participants, maxParticipants }: { participants: Participant[]; maxParticipants: number }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const columns = Math.min(4, Math.ceil(Math.sqrt(maxParticipants)));

  return (
    <div className="grid h-full w-full gap-2 p-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: maxParticipants }, (_, slotIndex) => {
        const participant = participants.find((item) => item.slot_index === slotIndex);
        const track = tracks.find((item) =>
          participant && (
            item.participant.identity === participant.account_id ||
            item.participant.identity.startsWith(`${participant.account_id}:`)
          ),
        );

        return (
          <div key={slotIndex} className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-white/15 bg-slate-800">
            {track ? (
              <ParticipantTile trackRef={track} className="h-full w-full" />
            ) : (
              <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 text-center text-slate-400">
                <UserOutlined className="text-2xl" />
                <span className="px-2 text-xs">{participant ? 'Đang kết nối camera...' : `Đang chờ người ${slotIndex + 1}`}</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/60 px-2 py-1 text-xs text-white">
              {participant ? `${participant.account.username}${participant.is_host ? ' · Chủ phòng' : ''}` : `Vị trí ${slotIndex + 1}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupLobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentRoom, setCurrentRoom } = useGroupCaptureStore();
  const { user } = useAuthStore();

  const [livekitRoom, setLivekitRoom] = useState<any>(null);
  const [savingEditPolicy, setSavingEditPolicy] = useState(false);
  const [openingStudio, setOpeningStudio] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pendingBackPath, setPendingBackPath] = useState<string | null>(null);
  const historyPushedRef = useRef(false);

  const isHost = currentRoom?.host_account_id === String(user?.id);
  const isAllReady = currentRoom?.participants?.length === currentRoom?.max_participants &&
    currentRoom?.participants?.every(p => p.status === 'ready');

  const handleRequestBack = useCallback((targetPath?: string) => {
    setPendingBackPath(targetPath || (isHost ? '/group/new/frame' : '/'));
    setIsCancelModalOpen(true);
  }, [isHost]);

  const confirmCancelAndGoBack = useCallback(() => {
    setIsCancelModalOpen(false);
    const destination = pendingBackPath || (isHost ? '/group/new/frame' : '/');
    setPendingBackPath(null);
    navigate(destination);
  }, [navigate, pendingBackPath, isHost]);

  // Handle browser back button: push history entry and show confirmation
  useEffect(() => {
    if (!historyPushedRef.current) {
      window.history.pushState({ groupStep: 'lobby' }, '');
      historyPushedRef.current = true;
    }

    const handlePopState = () => {
      // Prevent browser from navigating away immediately
      window.history.pushState({ groupStep: 'lobby' }, '');
      setPendingBackPath(isHost ? '/group/new/frame' : '/');
      setIsCancelModalOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isHost]);

  useEffect(() => {
    let sk: Socket | null = null;
    let lk: any = null;
    let pollInterval: any;
    let isCancelled = false;

    async function init() {
      if (!code || isCancelled) return;

      let room: Room;
      try {
        room = await roomsApi.getByCode(code);
        if (isCancelled) return;
        setCurrentRoom(room);

        if (room.status === 'expired') {
          navigate('/group/new');
          return;
        }

        const token = useAuthStore.getState().token || localStorage.getItem('accessToken') || '';
        sk = connectRoomSocket(token, room.id);
        if (isCancelled) {
          sk.disconnect();
          return;
        }

        // socket events
        sk.on('room:participant_joined', () => {
          if (!isCancelled) {
            roomsApi.getByCode(code).then((r) => {
              if (!isCancelled) setCurrentRoom(r);
            });
          }
        });

        sk.on('room:edit_policy_updated', () => {
          roomsApi.getByCode(code).then((updatedRoom) => {
            if (!isCancelled) setCurrentRoom(updatedRoom);
          });
        });

        sk.on('room:studio_opened', () => {
          if (!isCancelled) navigate(`/group/${code}/studio`);
        });

        try {
          const newLk = await joinLivekit(room.id);
          if (isCancelled) {
            newLk.disconnect();
            return;
          }
          lk = newLk;
          setLivekitRoom(lk);
          // Auto set ready when camera is on
          await roomsApi.ready(room.id);
          if (!isCancelled) {
            roomsApi.getByCode(code).then((r) => {
              if (!isCancelled) setCurrentRoom(r);
            });
          }
        } catch (e) {
          if (!isCancelled) message.error('Vui lòng cấp quyền camera/mic');
        }

        // Poll room status since ready/left events might be missing
        pollInterval = setInterval(async () => {
          if (isCancelled) {
            clearInterval(pollInterval);
            return;
          }
          try {
            const r = await roomsApi.getByCode(code);
            if (isCancelled) return;
            setCurrentRoom(r);
            if (r.status === 'waiting' || r.status === 'countdown' || r.status === 'capturing') {
              navigate(`/group/${code}/studio`);
            }
          } catch (e) { }
        }, 3000);

      } catch (error) {
        if (!isCancelled) navigate('/');
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (sk) sk.disconnect();
      if (lk) lk.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [code, navigate, setCurrentRoom]);

  const handleStart = async () => {
    if (!currentRoom) return;
    setOpeningStudio(true);
    try {
      await roomsApi.openStudio(currentRoom.id);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể mở buồng chụp');
      setOpeningStudio(false);
    }
  };

  const handleEditPolicyChange = async (hostOnly: boolean) => {
    if (!currentRoom) return;
    setSavingEditPolicy(true);
    try {
      await roomsApi.setEditPolicy(currentRoom.id, hostOnly ? 'host_only' : 'all_participants');
      setCurrentRoom(await roomsApi.getByCode(code!));
      message.success(hostOnly ? 'Chỉ trưởng phòng được chỉnh ảnh và đăng review' : 'Tất cả thành viên có thể chỉnh ảnh và đăng review');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật quyền hậu kỳ');
    } finally {
      setSavingEditPolicy(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28">
        <Spin size="large" tip="Đang tải thông tin phòng..." />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-24 md:px-8 md:pt-28">
      <GroupCaptureProgress
        activeStep={3}
        onStepClick={(idx) => {
          const paths = ['/group/new', '/group/new/size', '/group/new/frame'];
          handleRequestBack(paths[idx]);
        }}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1">Bước 4: Phòng Chờ</Title>
          <Text type="secondary">Chờ tất cả thành viên vào buồng chụp và bật camera trước khi bắt đầu</Text>
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => handleRequestBack()}
          className="rounded-full font-medium"
        >
          Quay lại chọn frame
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="text-center shadow-sm">
            <Text type="secondary">Mã tham gia buồng chụp</Text>
            <Title level={3} className="my-2 tracking-widest">{currentRoom.room_code}</Title>
            <div className="mt-4 p-2 bg-gray-100 rounded flex justify-center">
              <QRCodeSVG value={`${window.location.origin}/group/join/${currentRoom.room_code}`} size={160} />
            </div>
          </Card>

          <Card title="Danh sách thành viên" size="small">
            <div className="text-sm text-gray-500 mb-2">
              Sức chứa: {currentRoom.participants?.length || 0}/{currentRoom.max_participants}
            </div>
            <ul className="space-y-2">
              {currentRoom.participants?.map(p => (
                <li key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{p.account.username} {p.is_host ? '(Host)' : ''}</span>
                  <span className={`text-xs ${p.status === 'ready' ? 'text-green-600' : 'text-orange-500'}`}>
                    {p.status === 'ready' ? 'Sẵn sàng' : 'Chờ...'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {isHost ? (
            <Card title="Quyền hậu kỳ & đánh giá" size="small">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Chỉ trưởng phòng chỉnh sửa</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {currentRoom.edit_policy === 'host_only'
                      ? 'Chỉ bạn được hậu kỳ và đăng review.'
                      : 'Tắt: mỗi thành viên tự hậu kỳ và đăng review.'}
                  </div>
                </div>
                <Switch
                  checked={currentRoom.edit_policy === 'host_only'}
                  loading={savingEditPolicy}
                  onChange={handleEditPolicyChange}
                  aria-label="Chỉ trưởng phòng được chỉnh sửa ảnh"
                />
              </div>
            </Card>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {currentRoom.edit_policy === 'host_only'
                ? 'Trưởng phòng sẽ chỉnh sửa và đăng review.'
                : 'Sau khi chụp, bạn có thể tự chỉnh sửa và đăng review.'}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Card title="Khung Trực Tiếp" size="small" className="min-h-[400px]">
            {livekitRoom ? (
              <div className="h-[400px] w-full rounded-lg overflow-hidden bg-black">
                <LiveKitRoom room={livekitRoom} serverUrl={undefined} token={undefined}>
                  <LobbyStage participants={currentRoom.participants ?? []} maxParticipants={currentRoom.max_participants} />
                </LiveKitRoom>
              </div>
            ) : (
              <div className="h-[400px] w-full bg-black rounded-lg flex items-center justify-center text-white">
                Đang kết nối Camera...
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => handleRequestBack()}
            >
              Quay lại
            </Button>
            <Text type="secondary" className="hidden sm:inline">Chờ tất cả sẵn sàng để vào buồng chụp</Text>
          </div>
          {isHost ? (
            <Button
              type="primary"
              size="large"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleStart}
              disabled={!isAllReady || openingStudio}
            >
              {openingStudio ? 'ĐANG MỞ BUỒNG CHỤP...' : 'VÀO BUỒNG CHỤP'}
            </Button>
          ) : (
            <Button size="large" disabled>Chờ Host Bắt Đầu</Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        title={null}
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          setPendingBackPath(null);
        }}
        footer={null}
        centered
        width={420}
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Hủy lần chụp này?</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Nếu quay lại, phòng chụp hiện tại sẽ bị hủy và bạn sẽ rời khỏi phòng chờ. Bạn có chắc chắn muốn hủy không?
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsCancelModalOpen(false);
                setPendingBackPath(null);
              }}
              className="flex-1 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer bg-transparent"
            >
              Ở Lại Phòng Chờ
            </button>
            <button
              onClick={confirmCancelAndGoBack}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer border-0"
            >
              Hủy &amp; Quay Lại
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
