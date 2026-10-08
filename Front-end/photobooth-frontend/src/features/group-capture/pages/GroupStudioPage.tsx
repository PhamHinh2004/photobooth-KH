import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { connectRoomSocket, syncServerClock } from '../realtime/roomSocket';
import { joinLivekit } from '../media/useLiveKitRoom';
import { grabJpeg } from '../media/grabJpeg';
import { composeGroupPhoto } from '../compose/composeGroupPhoto';
import { roomsApi } from '../api/rooms.api';
import { getFrames } from '@/api/capture.api';
import type { Frame } from '@/types/capture.types';
import { Track, LocalVideoTrack, RoomEvent, Room as LiveKitRoomObj } from 'livekit-client';
import { Button, Typography, message, Card, Spin } from 'antd';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { LiveKitRoom, GridLayout, ParticipantTile, useTracks } from '@livekit/components-react';
import '@livekit/components-styles';
import axios from 'axios';
import gifshot from 'gifshot';
import { API_BASE_URL } from '@/api/apiConfig';
import FilterScreen from '@/components/capture/step5/FilterScreen';

const { Title, Text } = Typography;
const API = API_BASE_URL;

function StudioStage({ onCameraCountChange }: { onCameraCountChange: (count: number) => void }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  useEffect(() => {
    const cameraParticipants = new Set(
      tracks
        .filter((track) => Boolean(track.publication?.track))
        .map((track) => track.participant.identity),
    );
    onCameraCountChange(cameraParticipants.size);
  }, [tracks, onCameraCountChange]);

  return (
    <div className="w-full h-full">
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, videos: HTMLVideoElement[], width: number, height: number) {
  const count = videos.length;
  if (count === 0) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    return;
  }
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const w = width / cols;
  const h = height / rows;
  videos.forEach((v, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    ctx.drawImage(v, c * w, r * h, w, h);
  });
}

interface GroupPostProduction {
  photoUrl: string;
  frame: Frame;
  recordingId?: string;
  gifId?: string;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Không xuất được ảnh hậu kỳ')), 'image/png');
  });
}

export default function GroupStudioPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentRoom, selectedFrameId } = useGroupCaptureStore();
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [breakCountdown, setBreakCountdown] = useState<number | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(1);
  const [captureSequenceStarted, setCaptureSequenceStarted] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'composing' | 'editing'>('idle');
  const [postProduction, setPostProduction] = useState<GroupPostProduction | null>(null);
  const [capturedSlots, setCapturedSlots] = useState<Set<number>>(() => new Set());
  const capturedCount = capturedSlots.size;
  const [frameDetails, setFrameDetails] = useState<Frame | null>(null);
  const [livekitRoomObj, setLivekitRoomObj] = useState<LiveKitRoomObj | null>(null);
  const [connectedCameraCount, setConnectedCameraCount] = useState(0);
  const [flash, setFlash] = useState(false);
  
  const isHost = currentRoom?.host_account_id === String(user?.id);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!postProduction?.photoUrl) return;
    return () => URL.revokeObjectURL(postProduction.photoUrl);
  }, [postProduction?.photoUrl]);
  
  // Recording refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const gifFrames = useRef<string[]>([]);
  const drawIntervalRef = useRef<any>(null);
  const isRecording = useRef(false);

  useEffect(() => {
    async function fetchFrame() {
      try {
        const frames = await getFrames();
        const frameId = currentRoom?.frame_id || selectedFrameId;
        const found = frames.find(f => f.id === frameId);
        if (found) setFrameDetails(found);
      } catch (err) {
        console.error('Failed to load frame', err);
      }
    }
    fetchFrame();
  }, [currentRoom, selectedFrameId]);

  useEffect(() => {
    let sk: Socket | null = null;
    let lk: LiveKitRoomObj | null = null;
    let isCancelled = false;

    async function init() {
      if (!currentRoom || !code || isCancelled) return;
      
      const token = useAuthStore.getState().token || localStorage.getItem('accessToken') || '';
      sk = connectRoomSocket(token, currentRoom.id);
      if (isCancelled) {
        sk.disconnect();
        return;
      }
      setSocket(sk);
      const serverTimeOffset = await syncServerClock(sk);
      if (isCancelled) return;
      const getServerNow = () => Date.now() + serverTimeOffset;

      sk.on('room:countdown_started', ({ countdownEndsAt, roundIndex: activeRound, totalRounds: rounds }: { countdownEndsAt: number; roundIndex: number; totalRounds: number }) => {
        if (!isCancelled) {
          setBreakCountdown(null);
          setRoundIndex(activeRound);
          setTotalRounds(rounds);
          setCaptureSequenceStarted(true);
        }
        
        // Bắt đầu ghi hình lưới video
        if (isHost && canvasRef.current && !isRecording.current) {
          isRecording.current = true;
          recordedChunks.current = [];
          gifFrames.current = [];
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            try {
              const stream = canvasRef.current.captureStream(30);
              const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
              recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
              recorder.start();
              mediaRecorderRef.current = recorder;

              drawIntervalRef.current = setInterval(() => {
                const videos = Array.from(document.querySelectorAll('.lk-participant-tile video')) as HTMLVideoElement[];
                if (canvasRef.current && videos.length > 0) {
                  drawGrid(ctx, videos, canvasRef.current.width, canvasRef.current.height);
                  // Grab frame for GIF (~5 fps)
                  if (Date.now() % 200 < 50) {
                    gifFrames.current.push(canvasRef.current.toDataURL('image/jpeg', 0.4));
                  }
                }
              }, 33);
            } catch (err) {
              console.error('Recorder setup failed', err);
            }
          }
        }

        const timer = setInterval(() => {
          if (isCancelled) {
            clearInterval(timer);
            return;
          }
          const remaining = Math.ceil((countdownEndsAt - getServerNow()) / 1000);
          setCountdown(remaining > 0 ? remaining : null);
          if (remaining <= 0) clearInterval(timer);
        }, 100);
        const remaining = Math.ceil((countdownEndsAt - getServerNow()) / 1000);
        setCountdown(remaining > 0 ? remaining : null);
      });

      sk.on('room:break_started', ({ breakEndsAt }: { breakEndsAt: number }) => {
        setCountdown(null);
        const updateBreakCountdown = () => {
          const remaining = Math.ceil((breakEndsAt - getServerNow()) / 1000);
          setBreakCountdown(remaining > 0 ? remaining : null);
          if (remaining <= 0) clearInterval(timer);
        };
        const timer = setInterval(updateBreakCountdown, 100);
        updateBreakCountdown();
      });

      sk.on('room:capture_trigger', ({ triggerAt, roundIndex: activeRound, totalRounds: rounds }: { triggerAt: number; roundIndex: number; totalRounds: number }) => {
        const wait = Math.max(0, triggerAt - getServerNow());
        
        setTimeout(async () => {
          if (isCancelled) return;
          setCountdown(null);
          setBreakCountdown(null);
          setFlash(true);
          setTimeout(() => setFlash(false), 220);
          
          // Keep the shared recording alive until the final round.
          if (isHost && activeRound === rounds - 1) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
            isRecording.current = false;
          }

          if (!localVideoRef.current) return;
          try {
            const jpeg = await grabJpeg(localVideoRef.current);
            let success = false;
            for (let i = 0; i < 2; i++) {
              if (isCancelled) break;
              try {
                await roomsApi.uploadCapture(currentRoom.id, jpeg, activeRound);
                success = true;
                break;
              } catch (e) {
                console.error('Upload fail retry', e);
              }
            }
            if (!isCancelled && success) {
              message.success('Đã chụp!');
            } else if (!isCancelled) {
              message.error('Lỗi upload ảnh của bạn');
            }
          } catch (e) {
            console.error(e);
          }
        }, wait);
      });

      sk.on('room:participant_captured', ({ slotIndex }: { slotIndex: number }) => {
        if (!isCancelled) {
          setCapturedSlots((previous) => new Set(previous).add(slotIndex));
        }
      });

      sk.on('room:all_captured', async ({ roomId, slots }: any) => {
        const canEditResult = isHost || currentRoom?.edit_policy === 'all_participants';
        if (!canEditResult) {
          if (!isCancelled) setPhase('composing');
          return;
        }
        
        if (!isCancelled) setPhase('composing');
        try {
          const frames = await getFrames();
          const frameId = currentRoom?.frame_id || selectedFrameId;
          const frame = frames.find(f => f.id === frameId);
          if (!frame) throw new Error('Không tìm thấy khung trên hệ thống');

          const images = await Promise.all(
            slots.map(async (slot: any) => {
              const blob = await roomsApi.getCapture(roomId, slot.slotIndex);
              // @ts-ignore
              return createImageBitmap(blob);
            })
          );
          
          if (isCancelled) return;
          const { originalBlob } = await composeGroupPhoto({
            images, 
            layout: frame.layout_config, 
            frameImageUrl: frame.image_url || frame.thumbnail_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          });

          // Upload Video and GIF
          let videoId, gifId;
          const userToken = useAuthStore.getState().token || localStorage.getItem('accessToken');
          
          if (isHost && recordedChunks.current.length > 0) {
            const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const vf = new FormData();
            vf.append('file', videoBlob, 'recording.webm');
            try {
              const vr = await axios.post(`${API}/recordings`, vf, { headers: { Authorization: `Bearer ${userToken}` }});
              videoId = vr.data.id;
            } catch (err) { console.error('Video upload fail', err); }
          }

          if (isHost && gifFrames.current.length > 0) {
            await new Promise<void>((resolve) => {
              gifshot.createGIF({
                images: gifFrames.current,
                gifWidth: 640,
                gifHeight: 480,
                interval: 0.1,
                numFrames: 15
              }, async (obj: any) => {
                if (!obj.error) {
                  try {
                    const res = await fetch(obj.image);
                    const gifBlob = await res.blob();
                    const gf = new FormData();
                    gf.append('file', gifBlob, 'animated.gif');
                    const gr = await axios.post(`${API}/gifs`, gf, { headers: { Authorization: `Bearer ${userToken}` }});
                    gifId = gr.data.id;
                  } catch (err) { console.error('Gif upload fail', err); }
                }
                resolve();
              });
            });
          }

          if (isCancelled) return;
          setPostProduction({
            photoUrl: URL.createObjectURL(originalBlob),
            frame,
            recordingId: videoId,
            gifId,
          });
          setPhase('editing');
        } catch (e: any) {
          if (!isCancelled) {
            message.error(e.message || 'Lỗi ghép ảnh');
            setPhase('idle');
          }
        }
      });

      sk.on('room:composed_ready', () => {
        if (!isCancelled) navigate(`/group/${code}/result`);
      });

      try {
        const newLk = await joinLivekit(currentRoom.id);
        if (isCancelled) {
          newLk.disconnect();
          return;
        }
        lk = newLk;
        setLivekitRoomObj(lk);
        
        // Attach local camera to hidden video element for high-res snapshot
        if (localVideoRef.current) {
          await lk.localParticipant.setCameraEnabled(true);
          const attachTrack = () => {
            const pub = lk.localParticipant.getTrackPublication(Track.Source.Camera);
            if (pub && pub.track && localVideoRef.current) {
              (pub.track as LocalVideoTrack).attach(localVideoRef.current);
            }
          };
          attachTrack();
          lk.localParticipant.on(RoomEvent.LocalTrackPublished, attachTrack);
        }
      } catch (e) {
        console.error(e);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (sk) sk.disconnect();
      if (lk) lk.disconnect();
    };
  }, [code, currentRoom?.id, selectedFrameId, isHost, navigate]);

  if (phase === 'editing' && postProduction) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6">
        <FilterScreen
          photos={[postProduction.photoUrl]}
          frame={postProduction.frame}
          precomposed
          onBack={() => setPhase('idle')}
          onNext={async (processedCanvas, originalCanvas) => {
            if (!currentRoom) return;
            try {
              setPhase('composing');
              const [originalBlob, processedBlob] = await Promise.all([
                canvasToPngBlob(originalCanvas),
                canvasToPngBlob(processedCanvas),
              ]);
              await roomsApi.compose(
                currentRoom.id,
                originalBlob,
                processedBlob,
                postProduction.recordingId,
                postProduction.gifId,
              );
              if (currentRoom.edit_policy === 'all_participants') {
                navigate(`/group/${code}/result`);
              }
            } catch (error) {
              message.error(error instanceof Error ? error.message : 'Không thể lưu ảnh đã chỉnh');
              setPhase('editing');
            }
          }}
        />
      </main>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 relative">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="!m-0">Buồng Chụp Trực Tuyến</Title>
        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold">
          Tiến trình: {capturedCount}/{frameDetails?.layout_config.slots.length ?? currentRoom?.max_participants}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-100 bg-white/80 px-4 py-3 text-sm">
        <span className="font-semibold text-slate-700">Lượt chụp {roundIndex + 1}/{totalRounds}</span>
        <span className="text-slate-500">Mỗi lượt sẽ điền {currentRoom?.max_participants} ô tiếp theo trong frame.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Card className="bg-gray-900 overflow-hidden relative border-0" bodyStyle={{ padding: 0, height: 500 }}>
             {/* Hidden canvas for recording */}
             <canvas ref={canvasRef} width={1280} height={720} className="hidden" />
             {/* Hidden video for high-res photo */}
             <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
             
             {/* Split screen grid */}
             {livekitRoomObj ? (
               <div className="absolute inset-0 w-full h-full bg-black">
                 <LiveKitRoom room={livekitRoomObj} serverUrl={undefined} token={undefined}>
                   <StudioStage onCameraCountChange={setConnectedCameraCount} />
                 </LiveKitRoom>
               </div>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                 <Spin size="large" />
                 <div className="mt-4">Đang kết nối Camera...</div>
               </div>
             )}

             {flash && <div className="absolute inset-0 z-50 bg-white pointer-events-none" />}

             {countdown !== null && (
               <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/35 text-white backdrop-blur-[2px] animate-fadeIn pointer-events-none">
                 <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#89CFF0] bg-black/40 shadow-[0_0_50px_rgba(137,207,240,0.6)] sm:h-32 sm:w-32">
                   <span className="text-6xl font-black drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-pulse sm:text-7xl">{countdown}</span>
                 </div>
                 <span className="mt-3 rounded-full border border-white/20 bg-black/60 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                   Chuẩn bị chụp ảnh {roundIndex + 1}
                 </span>
               </div>
             )}

             {breakCountdown !== null && (
               <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 text-white backdrop-blur-[2px] animate-fadeIn pointer-events-none">
                 <div className="mb-1 text-base font-black uppercase text-[#FF00FF] drop-shadow-md sm:text-lg">✨ Chuẩn bị kiểu dáng mới!</div>
                 <div className="my-2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#FF00FF] bg-black/40 shadow-[0_0_40px_rgba(255,0,255,0.6)]">
                   <span className="text-5xl font-black animate-bounce sm:text-6xl">{breakCountdown}</span>
                 </div>
                 <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1 text-xs font-bold uppercase tracking-wider text-pink-200 backdrop-blur-md">Nghỉ 2 giây tạo dáng</span>
               </div>
             )}

             {phase === 'composing' && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-40">
                 <Spin size="large" />
                 <div className="mt-4 font-bold text-lg">{isHost ? 'Đang chuẩn bị ảnh hậu kỳ...' : 'Chủ phòng đang chỉnh sửa ảnh nhóm...'}</div>
               </div>
             )}
           </Card>
        </div>

        <div>
          <Card title={`Khung: ${frameDetails?.name || currentRoom?.frame_id || selectedFrameId}`} className="mb-4">
            <div className="bg-gray-100 h-[300px] flex items-center justify-center text-gray-500 rounded overflow-hidden">
              {frameDetails ? (
                <img 
                  src={frameDetails.image_url || frameDetails.thumbnail_url} 
                  alt={frameDetails.name} 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              ) : (
                <Spin tip="Đang tải khung..." />
              )}
            </div>
          </Card>
          
          {isHost && postProduction && phase === 'idle' ? (
            <Button type="primary" size="large" block className="bg-fuchsia-600 hover:bg-fuchsia-700 h-14 text-lg font-bold" onClick={() => setPhase('editing')}>
              TIẾP TỤC HẬU KỲ & STICKER
            </Button>
          ) : isHost && !postProduction && phase !== 'composing' ? (
            <>
              <div className="mb-2 text-center text-xs text-slate-500">
                Camera sẵn sàng: {connectedCameraCount}/{currentRoom?.participants?.length ?? currentRoom?.max_participants}
              </div>
              <Button
                type="primary"
                size="large"
                block
                className="bg-pink-600 hover:bg-pink-700 h-14 text-lg font-bold"
                onClick={async () => {
                  setCaptureSequenceStarted(true);
                  try {
                    await roomsApi.startCountdown(currentRoom!.id);
                  } catch (error) {
                    setCaptureSequenceStarted(false);
                    message.error(error instanceof Error ? error.message : 'Không thể bắt đầu chụp');
                  }
                }}
                disabled={captureSequenceStarted || countdown !== null || connectedCameraCount < (currentRoom?.participants?.length ?? currentRoom?.max_participants ?? 0)}
              >
                {countdown !== null ? `ĐANG ĐẾM NGƯỢC LƯỢT ${roundIndex + 1}...` : captureSequenceStarted ? `ĐANG CHỜ LƯỢT ${roundIndex + 1}/${totalRounds}` : 'BẮT ĐẦU CHỤP'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
