import { useNavigate } from 'react-router-dom';
import { useGroupCaptureStore } from '../store/roomStore';
import { Button, Input, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import GroupCaptureProgress from '../components/GroupCaptureProgress';
import { getGroupFrameLayouts } from '../groupFrameLayouts';

const { Text } = Typography;
const participantCounts = [2, 3, 4, 5, 6, 7, 8];
const lobbyTimes = [2, 2.5, 3];

export default function GroupSetupPage() {
  const navigate = useNavigate();
  const { draft, setDraft } = useGroupCaptureStore();
  const layoutSuggestions = getGroupFrameLayouts(draft.maxParticipants);

  const handleNext = () => {
    navigate('/group/new/size');
  };

  return (
    <main className="mx-auto w-full max-w-[1220px] px-4 pb-12 pt-5 md:px-8 md:pt-8">
      <GroupCaptureProgress activeStep={0} />

      <header className="mx-auto mb-8 max-w-2xl text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-700">
          <CameraOutlined /> Group setup
        </span>
        <h1 className="font-display-bubble text-3xl text-slate-900 md:text-4xl">Bước 1: Thiết lập phòng chụp nhóm</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Tạo không gian chụp chung, chọn số người và thời gian chờ trước khi chọn khung hình.
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:gap-7">
        <section className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow-[0_18px_50px_rgba(33,44,65,0.12)]">
          <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Group setup wizard</span>
            <span className="text-xs text-slate-400">01 / 06</span>
          </div>

          <div className="space-y-7 p-5 md:p-7">
            <div>
              <label htmlFor="group-room-name" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">1</span>
                Tên phòng chụp
              </label>
              <Input
                id="group-room-name"
                size="large"
                value={draft.name}
                onChange={(event) => setDraft({ name: event.target.value })}
                placeholder="Ví dụ: Hội Bạn Thân"
                maxLength={40}
                showCount
                className="!rounded-lg"
              />
              <div className="mt-2 flex flex-wrap gap-2" aria-label="Gợi ý tên phòng">
                {['Hội bạn thân', 'Team cuối tuần', 'Ngày kỷ niệm'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setDraft({ name })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-fuchsia-300 hover:text-fuchsia-700"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">2</span>
                  Số lượng thành viên
                </label>
                <Text type="secondary" className="text-xs">Hỗ trợ từ 2 đến 8 người</Text>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {participantCounts.map((count) => {
                  const isSelected = draft.maxParticipants === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDraft({ maxParticipants: count })}
                      className={`flex min-h-[66px] flex-col items-center justify-center rounded-lg border transition ${isSelected ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700 shadow-[0_4px_14px_rgba(217,70,239,0.12)]' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'}`}
                    >
                      <span className="text-lg font-bold leading-5">{count}</span>
                      <span className="mt-1 text-[10px]">Người</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-3 rounded-xl border border-sky-100 bg-sky-50/80 p-3 text-sm text-sky-900">
                <BulbOutlined className="mt-0.5 shrink-0 text-base text-sky-600" />
                <span>Với nhóm {draft.maxParticipants} người, bạn sẽ thấy các khung phù hợp ở bước tiếp theo.</span>
              </div>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">3</span>
                Thời gian chờ phòng
              </label>
              <div className="grid grid-cols-3 gap-2">
                {lobbyTimes.map((minutes) => {
                  const isSelected = draft.lobbyMinutes === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDraft({ lobbyMinutes: minutes })}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium transition ${isSelected ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'}`}
                    >
                      <ClockCircleOutlined /> {minutes} phút
                    </button>
                  );
                })}
              </div>
              <Text type="secondary" className="mt-2 block text-xs">
                Đồng hồ bắt đầu khi thành viên thứ hai vào phòng.
              </Text>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="self-start">
                Quay lại trang chủ
              </Button>
              <Button type="primary" size="large" onClick={handleNext} className="!h-11 !rounded-lg !bg-sky-700 !px-5 hover:!bg-sky-800">
                Tiếp tục: chọn khung <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-white bg-white/85 shadow-[0_16px_42px_rgba(33,44,65,0.1)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Mô phỏng phòng chờ</h2>
                <p className="mt-1 text-xs text-slate-500">{draft.name || 'Phòng mới'} · {draft.maxParticipants} vị trí</p>
              </div>
              <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-fuchsia-700">Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
              {Array.from({ length: draft.maxParticipants }).map((_, index) => (
                <div key={index} className={`flex aspect-[1.35] min-w-0 flex-col items-center justify-center rounded-xl border ${index === 0 ? 'border-sky-200 bg-sky-50/70 text-sky-700' : 'border-dashed border-slate-200 bg-slate-50/80 text-slate-400'}`}>
                  <span className={`mb-2 grid h-9 w-9 place-items-center rounded-full ${index === 0 ? 'bg-sky-100' : 'bg-white'}`}>
                    {index === 0 ? <CameraOutlined /> : <UserOutlined />}
                  </span>
                  <span className="max-w-full truncate px-2 text-xs font-semibold">{index === 0 ? 'Bạn (Chủ phòng)' : `Bạn bè #${index + 1}`}</span>
                  <span className="mt-1 text-[10px]">{index === 0 ? 'Sẵn sàng' : 'Đang chờ...'}</span>
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs sm:mx-5 sm:mb-5">
              <span className="text-slate-500">Thời gian chờ</span>
              <span className="font-semibold text-fuchsia-700">{draft.lobbyMinutes} phút</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Khung ảnh được đề xuất</h2>
                <p className="mt-1 text-xs text-slate-500">Chọn khung thật ở bước 2</p>
              </div>
              <TeamOutlined className="text-lg text-fuchsia-600" />
            </div>
            <div className={`grid gap-2 ${layoutSuggestions.length === 1 ? 'grid-cols-1' : layoutSuggestions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {layoutSuggestions.map((layout) => (
                <div key={layout.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2">
                  <div className="mx-auto flex h-14 w-full max-w-[94px] flex-col justify-center gap-0.5 rounded border border-slate-200 bg-slate-100 p-1" role="img" aria-label={`${layout.title}, ${layout.rows.reduce((total, count) => total + count, 0)} ô`}>
                    {layout.rows.map((slotsInRow, rowIndex) => (
                      <div
                        key={`${layout.id}-${rowIndex}`}
                        className="grid min-h-0 flex-1 gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${slotsInRow}, minmax(0, 1fr))`, width: `${(slotsInRow / Math.max(...layout.rows)) * 100}%`, marginInline: 'auto' }}
                      >
                        {Array.from({ length: slotsInRow }).map((_, slotIndex) => (
                          <span key={slotIndex} className="rounded-[2px] bg-slate-400/80" />
                        ))}
                      </div>
                    ))}
                  </div>
                  <span className="mt-2 block text-center text-[10px] font-medium leading-4 text-slate-600">{layout.title}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
