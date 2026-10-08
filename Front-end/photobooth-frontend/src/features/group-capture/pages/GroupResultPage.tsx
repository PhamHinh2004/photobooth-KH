import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { roomsApi } from '../api/rooms.api';
import { Button, Typography, message, Card, Spin, Modal, Input, Rate } from 'antd';
import { useAuthStore } from '@/stores/auth.store';
import { QRCodeSVG } from 'qrcode.react';
import { socialApi } from '@/api/social.api';

const { Title, Text } = Typography;

export default function GroupResultPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentRoom } = useGroupCaptureStore();
  const { user } = useAuthStore();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'gif'>('photo');
  const [sessionResultId, setSessionResultId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [rating, setRating] = useState(5);
  const [caption, setCaption] = useState('Vừa có một buổi chụp nhóm thật vui tại KH BOOTH AI!');

  const isHost = currentRoom?.host_account_id === String(user?.id);

  useEffect(() => {
    async function fetchResult() {
      if (!currentRoom) return;
      try {
        const res = await roomsApi.result(currentRoom.id);
        // @ts-ignore
        setPhotoUrl(res.photo?.processed_file_url || null);
        // @ts-ignore
        setRecordingUrl(res.recording?.file_url || null);
        // @ts-ignore
        setGifUrl(res.gif?.image_url || null);
        setSessionResultId(res.sessionResult?.id || null);
      } catch (e: any) {
        message.error('Không tải được kết quả');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [currentRoom]);

  const getActiveUrl = () => {
    if (activeTab === 'photo') return photoUrl;
    if (activeTab === 'video') return recordingUrl;
    if (activeTab === 'gif') return gifUrl;
    return null;
  };

  const handleDownload = () => {
    const url = getActiveUrl();
    if (!url) return;
    const ext = activeTab === 'photo' ? 'png' : activeTab === 'video' ? 'webm' : 'gif';
    const a = document.createElement('a');
    a.href = url;
    a.download = `Group_Photo_${code}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canShareReview = currentRoom?.edit_policy === 'all_participants' || isHost;

  const handleShareReview = async () => {
    if (!sessionResultId || !photoUrl) return;
    setIsSharing(true);
    try {
      await socialApi.createPost({
        session_id: sessionResultId,
        cover_image_url: photoUrl,
        caption,
        style_tags: ['#khbooth', '#photobooth', '#group'],
        rating,
      });
      setHasShared(true);
      setIsReviewOpen(false);
      navigate('/reviews');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể đăng bài đánh giá');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <Title level={2}>Kết Quả Nhóm</Title>
        <Text type="secondary">Cùng chia sẻ kỷ niệm tuyệt vời này!</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-md rounded-2xl flex flex-col items-center">
           <div className="flex justify-center gap-2 mb-4">
             <Button type={activeTab === 'photo' ? 'primary' : 'default'} onClick={() => setActiveTab('photo')}>Ảnh</Button>
             <Button type={activeTab === 'video' ? 'primary' : 'default'} onClick={() => setActiveTab('video')}>Video</Button>
             <Button type={activeTab === 'gif' ? 'primary' : 'default'} onClick={() => setActiveTab('gif')}>GIF</Button>
           </div>
           
           {loading ? (
             <div className="h-[400px] flex items-center justify-center w-full bg-gray-100 rounded-lg"><Spin /></div>
           ) : (
             <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg min-h-[400px]">
               {activeTab === 'photo' && photoUrl && <img src={photoUrl} alt="Group Result" className="max-w-full rounded-lg shadow-sm" />}
               {activeTab === 'video' && recordingUrl && <video src={recordingUrl} autoPlay loop controls className="max-w-full rounded-lg shadow-sm" />}
               {activeTab === 'gif' && gifUrl && <img src={gifUrl} alt="GIF" className="max-w-full rounded-lg shadow-sm" />}
               
               {activeTab === 'photo' && !photoUrl && <div className="text-gray-400">Chưa có ảnh</div>}
               {activeTab === 'video' && !recordingUrl && <div className="text-gray-400">Chưa có video</div>}
               {activeTab === 'gif' && !gifUrl && <div className="text-gray-400">Chưa có GIF</div>}
             </div>
           )}
        </Card>

        <div className="space-y-6">
          <Card title="Tải Về & Chia Sẻ" className="shadow-sm rounded-2xl">
            <Button 
              type="primary" 
              size="large" 
              block 
              className="bg-blue-600 hover:bg-blue-700 h-12 mb-4 font-bold"
              onClick={handleDownload}
              disabled={!getActiveUrl()}
            >
              TẢI VỀ MÁY
            </Button>
            
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl mt-4">
               <div className="text-center">
                 <div className="w-32 h-32 mx-auto mb-2 flex items-center justify-center p-2 rounded-lg bg-white shadow-sm">
                   {getActiveUrl() ? <QRCodeSVG value={getActiveUrl()!} size={112} /> : <span className="text-gray-400 text-xs">Chưa có kết quả</span>}
                 </div>
                 <Text type="secondary" className="text-xs">Quét mã tải về điện thoại</Text>
               </div>
            </div>
          </Card>

          {canShareReview && (
            <Button size="large" block type="primary" className="h-12 bg-indigo-600 font-bold" onClick={() => setIsReviewOpen(true)} disabled={hasShared || !sessionResultId}>
              {hasShared ? 'ĐÃ ĐĂNG BÀI ĐÁNH GIÁ' : 'ĐÁNH GIÁ & CHIA SẺ LÊN FEED'}
            </Button>
          )}

          <Button 
            size="large" 
            block 
            onClick={() => navigate('/group/new')}
            className="h-12 text-gray-600 font-bold"
          >
            TẠO PHÒNG MỚI
          </Button>
        </div>
      </div>

      <Modal
        title="Đánh giá buổi chụp nhóm"
        open={isReviewOpen}
        onCancel={() => setIsReviewOpen(false)}
        onOk={handleShareReview}
        confirmLoading={isSharing}
        okText="Đăng bài"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-fuchsia-600 border-none' }}
      >
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Đánh giá Frame:</span>
            <Rate value={rating} onChange={setRating} />
          </div>
          <Input.TextArea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Chia sẻ cảm nghĩ của bạn về buổi chụp..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
      </Modal>
    </div>
  );
}
