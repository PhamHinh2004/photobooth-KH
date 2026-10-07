import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { connectRoomSocket } from '../realtime/roomSocket';
import { joinLivekit } from '../media/useLiveKitRoom';
import { roomsApi } from '../api/rooms.api';
import { Button, Typography, message, Card } from 'antd';
import { Room } from '../types';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { LiveKitRoom, GridLayout, ParticipantTile, useTracks } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { QRCodeSVG } from 'qrcode.react';

const { Title, Text } = Typography;

function LobbyStage() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}

export default function GroupLobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentRoom, setCurrentRoom } = useGroupCaptureStore();
  const { user } = useAuthStore();

  const [livekitRoom, setLivekitRoom] = useState<any>(null);

  const isHost = currentRoom?.host_account_id === String(user?.id);
  const isAllReady = currentRoom?.participants?.length === currentRoom?.max_participants &&
    currentRoom?.participants?.every(p => p.status === 'ready');

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

        sk.on('room:countdown_started', () => {
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
            if (r.status === 'countdown' || r.status === 'capturing') {
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
    try {
      await roomsApi.startCountdown(currentRoom.id);
      // Wait for socket event 'room:countdown_started' to navigate
    } catch (e: any) {
      message.error(e.message || 'Lỗi bắt đầu chụp');
    }
  };

  if (!currentRoom) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Title level={2}>Phòng Chờ</Title>

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
        </div>

        <div className="md:col-span-2">
          <Card title="Khung Trực Tiếp" size="small" className="min-h-[400px]">
            {livekitRoom ? (
              <div className="h-[400px] w-full rounded-lg overflow-hidden bg-black">
                <LiveKitRoom room={livekitRoom} serverUrl={undefined} token={undefined}>
                  <LobbyStage />
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
          <Text type="secondary">Chờ tất cả sẵn sàng để vào buồng chụp</Text>
          {isHost ? (
            <Button
              type="primary"
              size="large"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleStart}
              disabled={!isAllReady}
            >
              VÀO BUỒNG CHỤP NGAY
            </Button>
          ) : (
            <Button size="large" disabled>Chờ Host Bắt Đầu</Button>
          )}
        </div>
      </div>
    </div>
  );
}
