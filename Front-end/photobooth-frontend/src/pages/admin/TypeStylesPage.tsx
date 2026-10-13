import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Modal, Spin, Switch, message } from 'antd';
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  TagsOutlined,
} from '@ant-design/icons';
import {
  typeStylesAdminApi,
  TypeStyleStatItem,
  TypeStylePayload,
} from '@/api/type-styles.admin.api';

const emptyForm: TypeStylePayload = { name: '', description: '', is_active: true, sort_order: 0 };

const getErrorMessage = (err: any) =>
  err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';

const TypeStylesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TypeStyleStatItem | null>(null);
  const [form, setForm] = useState<TypeStylePayload>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['adminTypeStyleStats'],
    queryFn: typeStylesAdminApi.getStats,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminTypeStyleStats'] });

  const saveMutation = useMutation({
    mutationFn: (payload: TypeStylePayload) =>
      editing ? typeStylesAdminApi.update(editing.id, payload) : typeStylesAdminApi.create(payload),
    onSuccess: () => {
      message.success(editing ? 'Cập nhật type style thành công' : 'Tạo type style thành công');
      setModalOpen(false);
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      typeStylesAdminApi.update(id, { is_active }),
    onSuccess: invalidate,
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => typeStylesAdminApi.remove(id),
    onSuccess: () => {
      message.success('Đã xóa type style');
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const items = useMemo(() => {
    const list = data?.items ?? [];
    return list.filter((i) => {
      if (statusFilter === 'active' && !i.is_active) return false;
      if (statusFilter === 'inactive' && i.is_active) return false;
      return i.name.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [data, search, statusFilter]);

  const maxFrames = Math.max(1, ...(data?.items ?? []).map((i) => i.frame_count));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: TypeStyleStatItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setModalOpen(true);
  };

  const confirmDelete = (item: TypeStyleStatItem) => {
    Modal.confirm({
      title: `Xóa type style "${item.name}"?`,
      content:
        item.frame_count > 0
          ? `${item.frame_count} frame đang thuộc style này sẽ trở thành "Chưa phân loại".`
          : 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) {
      message.warning('Vui lòng nhập tên type style');
      return;
    }
    saveMutation.mutate({
      ...form,
      name: form.name.trim(),
      sort_order: Number(form.sort_order) || 0,
    });
  };

  const ov = data?.overview;
  const assignedPct = ov && ov.total_frames ? Math.round((ov.assigned_frames / ov.total_frames) * 100) : 0;

  const metricCards = [
    {
      label: 'TỔNG TYPE STYLE',
      value: ov?.total_styles,
      sub: `${ov?.active_styles ?? 0} đang hoạt động`,
      icon: <TagsOutlined />,
      color: 'blue',
    },
    {
      label: 'FRAME ĐÃ PHÂN LOẠI',
      value: ov?.assigned_frames,
      sub: `${assignedPct}% / ${ov?.total_frames ?? 0} frame`,
      icon: <PictureOutlined />,
      color: 'indigo',
      progress: assignedPct,
    },
    {
      label: 'FRAME CHƯA PHÂN LOẠI',
      value: ov?.unassigned_frames,
      sub: 'Cần gán type style',
      icon: <AppstoreOutlined />,
      color: 'amber',
    },
    {
      label: 'TỔNG LƯỢT SỬ DỤNG',
      value: ov?.total_usage,
      sub: 'Của các frame đã phân loại',
      icon: <FireOutlined />,
      color: 'pink',
    },
  ];

  const colorMap: Record<string, { bg: string; soft: string; text: string; bar: string }> = {
    blue: { bg: 'bg-blue-50', soft: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-50', soft: 'bg-indigo-100', text: 'text-indigo-600', bar: 'bg-indigo-500' },
    amber: { bg: 'bg-amber-50', soft: 'bg-amber-100', text: 'text-amber-600', bar: 'bg-amber-400' },
    pink: { bg: 'bg-pink-50', soft: 'bg-pink-100', text: 'text-pink-600', bar: 'bg-pink-500' },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản Lý Type Style</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">HỆ THỐNG</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-[#e94560] uppercase tracking-wider">PHÂN LOẠI FRAME</span>
            </div>
          </div>
          <button
            id="btn-create-type-style"
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e94560] hover:bg-[#d63851] text-white rounded-xl text-sm font-bold shadow-md shadow-[#e94560]/30 transition-all hover:-translate-y-0.5"
          >
            <PlusOutlined /> Thêm Type Style
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((c) => {
            const col = colorMap[c.color];
            return (
              <div
                key={c.label}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group"
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 ${col.bg} rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0`} />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{c.label}</span>
                    <div className={`w-8 h-8 rounded-full ${col.soft} flex items-center justify-center ${col.text}`}>
                      {c.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gray-800">
                    {isLoading ? <Spin size="small" /> : (c.value ?? 0).toLocaleString()}
                  </div>
                  {c.progress !== undefined ? (
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className={`${col.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${c.progress}%` }} />
                    </div>
                  ) : null}
                  <div className="text-xs text-gray-500 mt-2 font-medium">{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full lg:w-[360px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchOutlined className="text-gray-400" />
            </div>
            <input
              id="search-type-style"
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] focus:border-transparent text-sm transition-all font-medium"
              placeholder="Tìm theo tên type style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([
              { label: 'Tất cả', value: 'all' },
              { label: 'Hoạt động', value: 'active' },
              { label: 'Đã ẩn', value: 'inactive' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusFilter === opt.value ? 'bg-[#e94560] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden border border-gray-100 border-t-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  {['Type Style', 'Số Frame', 'Frame Hoạt Động', 'Lượt Dùng', 'Rating TB', 'Thứ Tự', 'Trạng Thái', 'Thao Tác'].map((h, idx) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 ${
                        idx === 7 ? 'text-right' : idx >= 2 ? 'text-center' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center"><Spin size="large" /></td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Chưa có type style nào phù hợp
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e94560] to-[#ff8a65] text-white flex items-center justify-center font-black shadow-sm">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[240px]">
                              {item.description || 'Không có mô tả'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <span className="text-sm font-black text-gray-800 w-6">{item.frame_count}</span>
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#e94560] h-full rounded-full transition-all duration-700"
                              style={{ width: `${(item.frame_count / maxFrames) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.active_frame_count}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.total_usage.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                          <StarFilled className="text-xs" /> {item.avg_rating ? item.avg_rating.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">{item.sort_order}</td>
                      <td className="px-6 py-4 text-center">
                        <Switch
                          size="small"
                          checked={item.is_active}
                          loading={toggleMutation.isPending && toggleMutation.variables?.id === item.id}
                          onChange={(checked) => toggleMutation.mutate({ id: item.id, is_active: checked })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            title="Sửa"
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-blue-500"
                          >
                            <EditOutlined className="text-xs" />
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            title="Xóa"
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-red-500"
                          >
                            <DeleteOutlined className="text-xs" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/type-styles/${item.id}`)}
                            title="Xem chi tiết"
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-[#e94560] hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-[#e94560]"
                          >
                            <ArrowRightOutlined className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? 'Cập nhật Type Style' : 'Thêm Type Style mới'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        confirmLoading={saveMutation.isPending}
        okButtonProps={{ style: { background: '#e94560' } }}
        destroyOnClose
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên *</label>
            <input
              id="input-type-style-name"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] text-sm font-medium"
              placeholder="VD: Vintage, Cute, Hàn Quốc..."
              value={form.name}
              maxLength={100}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả</label>
            <textarea
              id="input-type-style-desc"
              rows={3}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] text-sm font-medium resize-none"
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thứ tự hiển thị</label>
              <input
                id="input-type-style-order"
                type="number"
                className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#e94560] text-sm font-medium"
                value={form.sort_order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col items-start gap-2 pt-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hoạt động</label>
              <Switch checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TypeStylesPage;
