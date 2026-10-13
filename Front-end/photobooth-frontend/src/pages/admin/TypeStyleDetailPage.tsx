import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  FireOutlined,
  PictureOutlined,
  PlusOutlined,
  StarFilled,
  TrophyOutlined,
} from '@ant-design/icons';
import { FrameItem, typeStylesAdminApi } from '@/api/type-styles.admin.api';

const sessionLabel: Record<string, string> = { single: 'Cá nhân', group: 'Nhóm', both: 'Cả hai' };
const sessionColor: Record<string, string> = {
  single: 'bg-blue-500',
  group: 'bg-purple-500',
  both: 'bg-emerald-500',
};

const getErrorMessage = (err: any) =>
  err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';

const BreakdownBar = ({
  title,
  data,
  total,
  labelOf = (k: string) => k,
  colorOf = () => 'bg-[#e94560]',
}: {
  title: string;
  data: Record<string, number>;
  total: number;
  labelOf?: (k: string) => string;
  colorOf?: (k: string) => string;
}) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([k, v]) => {
            const pct = total ? Math.round((v / total) * 100) : 0;
            return (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">{labelOf(k)}</span>
                  <span className="font-medium text-gray-500">{v} · {pct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className={`${colorOf(k)} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TypeStyleDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminTypeStyleDetail', id],
    queryFn: () => typeStylesAdminApi.getDetail(id),
    enabled: !!id,
  });

  const { data: unassigned, isLoading: isUnassignedLoading } = useQuery({
    queryKey: ['adminUnassignedFrames'],
    queryFn: typeStylesAdminApi.getUnassignedFrames,
    enabled: assignOpen,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminTypeStyleDetail', id] });
    queryClient.invalidateQueries({ queryKey: ['adminUnassignedFrames'] });
    queryClient.invalidateQueries({ queryKey: ['adminTypeStyleStats'] });
  };

  const assignMutation = useMutation({
    mutationFn: () => typeStylesAdminApi.assignFrames(id, selected),
    onSuccess: (res) => {
      message.success(res?.message || 'Đã gán frame');
      setAssignOpen(false);
      setSelected([]);
      refresh();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const unassignMutation = useMutation({
    mutationFn: (frameId: string) => typeStylesAdminApi.unassignFrame(id, frameId),
    onSuccess: () => {
      message.success('Đã gỡ frame khỏi type style');
      refresh();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const confirmUnassign = (frame: FrameItem) =>
    Modal.confirm({
      title: `Gỡ "${frame.name}" khỏi type style?`,
      content: 'Frame sẽ trở thành "Chưa phân loại", không bị xóa.',
      okText: 'Gỡ',
      cancelText: 'Hủy',
      onOk: () => unassignMutation.mutateAsync(frame.id),
    });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fe]">
        <Spin size="large" />
      </div>
    );
  }

  const { stats, frames } = data;
  const activePct = stats.frame_count ? Math.round((stats.active_frame_count / stats.frame_count) * 100) : 0;

  const cards = [
    { label: 'TỔNG FRAME', value: stats.frame_count, icon: <PictureOutlined />, soft: 'bg-blue-100 text-blue-600', bg: 'bg-blue-50', sub: `${stats.active_frame_count} đang hoạt động (${activePct}%)` },
    { label: 'LƯỢT SỬ DỤNG', value: stats.total_usage.toLocaleString(), icon: <FireOutlined />, soft: 'bg-pink-100 text-pink-600', bg: 'bg-pink-50', sub: stats.frame_count ? `TB ${Math.round(stats.total_usage / stats.frame_count)} lượt / frame` : '—' },
    { label: 'RATING TRUNG BÌNH', value: stats.avg_rating ? stats.avg_rating.toFixed(1) : '-', icon: <StarFilled />, soft: 'bg-amber-100 text-amber-600', bg: 'bg-amber-50', sub: `${stats.total_rating_count} lượt đánh giá` },
    { label: 'FRAME HOẠT ĐỘNG', value: `${activePct}%`, icon: <CheckCircleOutlined />, soft: 'bg-emerald-100 text-emerald-600', bg: 'bg-emerald-50', sub: `${stats.frame_count - stats.active_frame_count} frame đang ẩn` },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fe] p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/type-styles')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#e94560] mb-4 transition-colors"
        >
          <ArrowLeftOutlined /> Quay lại danh sách
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#ff8a65] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#e94560]/30">
              {data.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{data.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    data.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.is_active ? 'Hoạt động' : 'Đã ẩn'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{data.description || 'Không có mô tả'}</p>
            </div>
          </div>
          <button
            id="btn-assign-frames"
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e94560] hover:bg-[#d63851] text-white rounded-xl text-sm font-bold shadow-md shadow-[#e94560]/30 transition-all hover:-translate-y-0.5"
          >
            <PlusOutlined /> Gán frame
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => (
            <div key={c.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${c.bg} rounded-full group-hover:scale-150 transition-transform duration-500 ease-out`} />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{c.label}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.soft}`}>{c.icon}</div>
                </div>
                <div className="text-3xl font-black text-gray-800">{c.value}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown + top frame */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <BreakdownBar
            title="Theo loại phiên chụp"
            data={stats.by_session_type}
            total={stats.frame_count}
            labelOf={(k) => sessionLabel[k] || k}
            colorOf={(k) => sessionColor[k] || 'bg-gray-400'}
          />
          <BreakdownBar
            title="Theo bố cục (aspect ratio)"
            data={stats.by_aspect_ratio}
            total={stats.frame_count}
            labelOf={(k) => (k === 'unknown' ? 'Không xác định' : k)}
          />
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 rounded-2xl shadow-sm text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#e94560]/20 rounded-full blur-2xl" />
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrophyOutlined className="text-amber-400" /> Frame phổ biến nhất
            </h3>
            {stats.top_frame ? (
              <div className="flex gap-4 relative z-10">
                <img
                  src={stats.top_frame.thumbnail_url || stats.top_frame.image_url}
                  alt={stats.top_frame.name}
                  className="w-20 h-28 object-contain rounded-lg bg-white/10 p-1"
                />
                <div className="min-w-0">
                  <div className="font-black text-lg truncate">{stats.top_frame.name}</div>
                  <div className="text-sm text-white/70 mt-1">{stats.top_frame.usage_count.toLocaleString()} lượt dùng</div>
                  <div className="text-sm text-amber-400 mt-1 flex items-center gap-1">
                    <StarFilled /> {stats.top_frame.rating ? stats.top_frame.rating.toFixed(1) : '-'}
                    <span className="text-white/50">({stats.top_frame.rating_count})</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/50 relative z-10">Chưa có frame nào</p>
            )}
          </div>
        </div>

        {/* Frame list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900">Danh sách frame ({frames.length})</h2>
            <span className="text-xs font-medium text-gray-400">Sắp xếp theo lượt dùng</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  {['Frame', 'Bố Cục', 'Loại Phiên', 'Kích Thước', 'Lượt Dùng', 'Rating', 'Trạng Thái', 'Ngày Tạo', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 ${
                        i >= 4 && i <= 6 ? 'text-center' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {frames.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Chưa có frame nào thuộc type style này
                    </td>
                  </tr>
                ) : (
                  frames.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={f.thumbnail_url || f.image_url}
                            alt={f.name}
                            className="w-12 h-16 object-contain rounded-lg bg-gray-50 border border-gray-100"
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{f.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">ID: {f.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-700">{f.aspect_ratio || '-'}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700">
                          <span className={`w-2 h-2 rounded-full ${sessionColor[f.session_type_supported]}`} />
                          {sessionLabel[f.session_type_supported]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-medium">{f.width}×{f.height}</td>
                      <td className="px-6 py-3 text-center text-sm font-black text-gray-800">{f.usage_count.toLocaleString()}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                          <StarFilled className="text-xs" /> {f.rating ? f.rating.toFixed(1) : '-'}
                          <span className="text-gray-400 font-medium text-xs">({f.rating_count})</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            f.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {f.is_active ? 'Hoạt động' : 'Ẩn'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-medium">
                        {new Date(f.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => confirmUnassign(f)}
                          title="Gỡ khỏi type style"
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-red-500 ml-auto"
                        >
                          <DisconnectOutlined className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        title="Gán frame chưa phân loại"
        onCancel={() => { setAssignOpen(false); setSelected([]); }}
        onOk={() => assignMutation.mutate()}
        okText={`Gán ${selected.length} frame`}
        cancelText="Hủy"
        okButtonProps={{ disabled: selected.length === 0, style: selected.length ? { background: '#e94560' } : undefined }}
        confirmLoading={assignMutation.isPending}
        width={720}
      >
        {isUnassignedLoading ? (
          <div className="py-10 text-center"><Spin /></div>
        ) : !unassigned?.length ? (
          <p className="py-10 text-center text-gray-500">Tất cả frame đều đã được phân loại 🎉</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pt-2">
            {unassigned.map((f) => {
              const isSel = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    setSelected((s) => (isSel ? s.filter((x) => x !== f.id) : [...s, f.id]))
                  }
                  className={`relative p-2 rounded-xl border-2 text-left transition-all ${
                    isSel ? 'border-[#e94560] bg-[#e94560]/5 scale-[0.98]' : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {isSel && (
                    <CheckCircleOutlined className="absolute top-2 right-2 text-[#e94560] text-lg bg-white rounded-full" />
                  )}
                  <img
                    src={f.thumbnail_url || f.image_url}
                    alt={f.name}
                    className="w-full h-28 object-contain rounded-lg bg-gray-50"
                  />
                  <div className="text-xs font-bold text-gray-800 mt-2 truncate">{f.name}</div>
                  <div className="text-[10px] text-gray-400">{f.aspect_ratio || '-'} · {f.usage_count} lượt</div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TypeStyleDetailPage;
