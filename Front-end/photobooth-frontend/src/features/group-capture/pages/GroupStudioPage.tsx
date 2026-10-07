import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { connectRoomSocket } from '../realtime/roomSocket';
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

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function StudioStage() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
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

export default function GroupStudioPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentRoom, selectedFrameId } = useGroupCaptureStore();
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'composing'>('idle');
  const [capturedCount, setCapturedCount] = useState(0);
  const [frameDetails, setFrameDetails] = useState<Frame | null>(null);
  const [livekitRoomObj, setLivekitRoomObj] = useState<LiveKitRoomObj | null>(null);
  
  const isHost = currentRoom?.host_account_id === String(user?.id);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  
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

      sk.on('room:countdown_started', ({ countdownSeconds }: { countdownSeconds: number }) => {
        let c = countdownSeconds;
        if (!isCancelled) setCountdown(c);
        
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
          c -= 1;
          if (!isCancelled) {
            if (c > 0) setCountdown(c);
            else {
              clearInterval(timer);
              setCountdown(null);
            }
          } else {
             clearInterval(timer);
          }
        }, 1000);
      });

      sk.on('room:capture_trigger', ({ triggerAt }: { triggerAt: number }) => {
        const wait = Math.max(0, triggerAt - Date.now());
        
        setTimeout(async () => {
          if (isCancelled) return;
          
          // Dừng ghi hình
          if (isHost) {
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
                await roomsApi.uploadCapture(currentRoom.id, jpeg);
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

      sk.on('room:participant_captured', () => {
        if (!isCancelled) setCapturedCount(prev => prev + 1);
      });

      sk.on('room:all_captured', async ({ roomId, slots }: any) => {
        if (!isHost) {
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
          const { originalBlob, processedBlob } = await composeGroupPhoto({
            images, 
            layout: frame.layout_config, 
            frameImageUrl: frame.image_url || frame.thumbnail_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          });

          // Upload Video and GIF
          let videoId, gifId;
          const userToken = useAuthStore.getState().token || localStorage.getItem('accessToken');
          
          if (recordedChunks.current.length > 0) {
            const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const vf = new FormData();
            vf.append('file', videoBlob, 'recording.webm');
            try {
              const vr = await axios.post(`${API}/recordings`, vf, { headers: { Authorization: `Bearer ${userToken}` }});
              videoId = vr.data.id;
            } catch (err) { console.error('Video upload fail', err); }
          }

          if (gifFrames.current.length > 0) {
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
          await roomsApi.compose(roomId, originalBlob, processedBlob, videoId, gifId);
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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 relative">
      {countdown && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-[120px] font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            {countdown}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="!m-0">Buồng Chụp Trực Tuyến</Title>
        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold">
          Tiến trình: {capturedCount}/{currentRoom?.max_participants}
        </div>
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
                   <StudioStage />
                 </LiveKitRoom>
               </div>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                 <Spin size="large" />
                 <div className="mt-4">Đang kết nối Camera...</div>
               </div>
             )}

             {phase === 'composing' && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-40">
                 <Spin size="large" />
                 <div className="mt-4 font-bold text-lg">Đang ghép ảnh và tạo Video/GIF...</div>
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
          
          {isHost && phase !== 'composing' && (
            <Button 
              type="primary" 
              size="large" 
              block 
              className="bg-pink-600 hover:bg-pink-700 h-14 text-lg font-bold"
              onClick={() => roomsApi.startCountdown(currentRoom!.id)}
              disabled={countdown !== null}
            >
              {countdown !== null ? 'ĐANG CHỤP...' : 'BẮT ĐẦU CHỤP TỰ ĐỘNG'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
