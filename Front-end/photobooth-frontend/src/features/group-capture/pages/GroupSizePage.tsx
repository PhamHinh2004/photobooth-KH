import { useNavigate } from 'react-router-dom';
import PackageSelector from '@/components/capture/step1/PackageSelector';
import GroupCaptureProgress from '../components/GroupCaptureProgress';
import { getGroupFrameLayouts } from '../groupFrameLayouts';
import { useGroupCaptureStore } from '../store/roomStore';

export default function GroupSizePage() {
  const navigate = useNavigate();
  const { draft, selectedLayoutId, setSelectedLayoutId, setSelectedFrameId } = useGroupCaptureStore();
  const layouts = getGroupFrameLayouts(draft.maxParticipants);

  return (
    <main className="mx-auto w-full max-w-[1220px] px-4 pb-32 pt-5 md:px-8 md:pt-8">
      <GroupCaptureProgress activeStep={1} />
      <PackageSelector
        options={layouts}
        initialSelectedId={selectedLayoutId ?? layouts[0]?.id}
        heading="Bước 2: Chọn kích thước Frame"
        description={`Chọn bố cục ảnh phù hợp cho nhóm ${draft.maxParticipants} người. Các lựa chọn được giới hạn theo số thành viên.`}
        eyebrow="GROUP PHOTOBOOTH EXPERIENCE"
        backLabel="Quay lại cấu hình phòng"
        continueLabel="Tiếp tục: chọn Style (Bước 3)"
        onBack={() => navigate('/group/new')}
        onSelectPackage={(layout) => {
          if (layout.id !== selectedLayoutId) setSelectedFrameId(null);
          setSelectedLayoutId(layout.id);
          navigate('/group/new/frame');
        }}
      />
    </main>
  );
}