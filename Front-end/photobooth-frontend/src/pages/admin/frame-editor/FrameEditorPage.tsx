import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type Konva from 'konva';
import { Modal, message, Input } from 'antd';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  FileAddOutlined,
  MinusOutlined,
  PlusOutlined,
  RedoOutlined,
  UndoOutlined,
  ExpandOutlined,
  SaveOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/api/admin.api';
import EditorCanvas, { requestFitZoom } from './EditorCanvas';
import ToolSidebar from './ToolSidebar';
import PropertiesPanel from './PropertiesPanel';
import PublishModal, { type PublishValues } from './PublishModal';
import { useEditorStore } from './editor.store';
import { buildLayoutConfig, exportFramePng, downloadFramePng, type ExportResult } from './exportFrame';
import { normalizeAspectRatioForBackend } from './presets';


const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
};

const FrameEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const dirty = useEditorStore((s) => s.past.length > 0);
  const frameName = useEditorStore((s) => s.frameName);
  const setFrameName = useEditorStore((s) => s.setFrameName);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const saveCustomTemplate = useEditorStore((s) => s.saveCustomTemplate);
  const customerPreview = useEditorStore((s) => s.customerPreview);
  const setCustomerPreview = useEditorStore((s) => s.setCustomerPreview);

  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');

  const handleSaveAsTemplate = () => {
    const name = tplName.trim() || frameName.trim() || 'Mẫu Photobooth của tôi';
    const desc = tplDesc.trim() || 'Mẫu tự thiết kế';
    saveCustomTemplate(name, desc);
    message.success(`Đã lưu "${name}" vào Thư Viện Mẫu của bạn thành công!`);
    setSaveTplOpen(false);
    setTplName('');
    setTplDesc('');
  };

  // ---- Phím tắt ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const st = useEditorStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        st.redo();
      } else if (mod && key === 'd') {
        e.preventDefault();
        if (st.selection.length) st.duplicateObjects(st.selection);
      } else if (mod && key === 'a') {
        e.preventDefault();
        st.setSelection(st.doc.objects.filter((o) => !o.locked && o.visible !== false).map((o) => o.id));
      } else if (key === 'delete' || key === 'backspace') {
        if (st.selection.length) {
          e.preventDefault();
          st.removeObjects(st.selection.filter((id) => !st.doc.objects.find((o) => o.id === id)?.locked));
        }
      } else if (key === 'escape') {
        st.setSelection([]);
      } else if (key.startsWith('arrow') && st.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        st.moveBy(st.selection, dx, dy);
      } else if (mod && (key === '=' || key === '+')) {
        e.preventDefault();
        st.setZoom(st.zoom * 1.2);
      } else if (mod && key === '-') {
        e.preventDefault();
        st.setZoom(st.zoom / 1.2);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- Cảnh báo khi rời trang với thay đổi chưa xuất bản ----
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  /** Xuất canvas ra Blob PNG trong suốt và Data URL (đục lỗ tại slot) */
  const renderFrame = useCallback(async (): Promise<ExportResult> => {
    const stage = stageRef.current;
    if (!stage) throw new Error('Canvas chưa sẵn sàng');
    const st = useEditorStore.getState();
    st.setExporting(true);
    try {
      await nextPaint();
      return await exportFramePng(stage, st.doc, st.zoom);
    } finally {
      st.setExporting(false);
    }
  }, []);

  const handleDownload = async () => {
    try {
      setBusy(true);
      message.loading({ content: 'Đang kết xuất và tạo file PNG trong suốt...', key: 'fe-download', duration: 0 });
      const { blob, dataUrl } = await renderFrame();
      const filename = `frame_${(frameName || 'design').trim() || 'photobooth'}_${Date.now()}`;
      const saved = await downloadFramePng(dataUrl, blob, filename);
      if (saved !== false) {
        message.success({ content: 'Đã tải PNG trong suốt về máy thành công!', key: 'fe-download', duration: 3 });
      } else {
        message.destroy('fe-download');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        message.destroy('fe-download');
        return;
      }
      console.error(err);
      message.error({ content: 'Không thể xuất ảnh. Vui lòng kiểm tra lại canvas!', key: 'fe-download', duration: 4 });
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (values: PublishValues) => {
    try {
      setBusy(true);
      message.loading({ content: 'Đang kết xuất và xuất bản lên Server...', key: 'fe-publish', duration: 0 });
      const doc = useEditorStore.getState().doc;
      const { blob } = await renderFrame();

      const form = new FormData();
      form.append('name', values.name.trim());
      form.append('session_type_supported', values.sessionType);
      form.append('sort_order', '0');

      // Chuẩn hoá aspect_ratio khớp enum FrameAspectRatio backend
      const normalizedRatio = normalizeAspectRatioForBackend(values.aspectRatio);
      if (normalizedRatio) {
        form.append('aspect_ratio', normalizedRatio);
      }

      if (values.typeStyleId && values.typeStyleId.trim()) {
        form.append('type_style_id', values.typeStyleId.trim());
      }

      form.append('layout_config', JSON.stringify(buildLayoutConfig(doc)));
      form.append('file', blob, `frame_${Date.now()}.png`);

      await adminApi.createFrame(form);
      message.success({ content: 'Xuất bản thành công! Frame đã sẵn sàng trên Kiosk.', key: 'fe-publish', duration: 4 });
      setPublishOpen(false);
    } catch (err: any) {
      console.error('Publish error:', err);
      const msg = err?.response?.data?.message;
      message.error({
        content: 'Lỗi xuất bản: ' + (Array.isArray(msg) ? msg.join(', ') : msg || err.message),
        key: 'fe-publish',
        duration: 5,
      });
    } finally {
      setBusy(false);
    }
  };


  const handleNew = () => {
    const doReset = () => useEditorStore.getState().reset();
    if (!dirty) return doReset();
    Modal.confirm({
      title: 'Tạo thiết kế mới?',
      content: 'Thiết kế hiện tại sẽ bị xoá và không thể khôi phục.',
      okText: 'Tạo mới',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: doReset,
    });
  };

  const handleBack = () => {
    if (!dirty) return navigate('/admin/create-frame');
    Modal.confirm({
      title: 'Rời khỏi trình thiết kế?',
      content: 'Thiết kế vẫn được giữ trong phiên này nhưng sẽ mất khi tải lại trang.',
      okText: 'Rời đi',
      cancelText: 'Ở lại',
      onOk: () => navigate('/admin/create-frame'),
    });
  };

  const tbBtn =
    'h-9 px-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 font-sans">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
        <button id="fe-back" onClick={handleBack} className={`${tbBtn} text-gray-600 hover:bg-gray-100`}>
          <ArrowLeftOutlined /> Thoát
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d81e69] to-[#ff7a45] text-white flex items-center justify-center font-black text-sm shadow">
            F
          </div>
          <input
            id="fe-name"
            value={frameName}
            onChange={(e) => setFrameName(e.target.value)}
            placeholder="Frame chưa đặt tên"
            className="w-56 bg-transparent font-bold text-gray-800 outline-none border-b border-transparent hover:border-gray-300 focus:border-[#d81e69] py-1 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button id="fe-undo" title="Hoàn tác (Ctrl+Z)" onClick={undo} disabled={!canUndo} className={`${tbBtn} px-2.5 text-gray-600 hover:bg-gray-100`}>
            <UndoOutlined />
          </button>
          <button id="fe-redo" title="Làm lại (Ctrl+Y)" onClick={redo} disabled={!canRedo} className={`${tbBtn} px-2.5 text-gray-600 hover:bg-gray-100`}>
            <RedoOutlined />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button title="Thu nhỏ" onClick={() => setZoom(zoom / 1.2)} className="w-7 h-7 rounded-md hover:bg-white text-gray-600 flex items-center justify-center">
            <MinusOutlined />
          </button>
          <span className="w-12 text-center text-xs font-mono font-bold text-gray-700">{Math.round(zoom * 100)}%</span>
          <button title="Phóng to" onClick={() => setZoom(zoom * 1.2)} className="w-7 h-7 rounded-md hover:bg-white text-gray-600 flex items-center justify-center">
            <PlusOutlined />
          </button>
          <button id="fe-fit" title="Vừa màn hình" onClick={requestFitZoom} className="w-7 h-7 rounded-md hover:bg-white text-gray-600 flex items-center justify-center">
            <ExpandOutlined />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <button id="fe-new" onClick={handleNew} className={`${tbBtn} text-gray-600 hover:bg-gray-100`}>
          <FileAddOutlined /> Mới
        </button>
        <button
          id="fe-customer-preview-btn"
          onClick={() => setCustomerPreview(!customerPreview)}
          className={`${tbBtn} border transition-all ${
            customerPreview
              ? 'border-purple-400 text-purple-700 bg-purple-50 font-bold shadow-xs'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          title="Bật/Tắt bóng người khách hàng đứng vào ô để xem trước bố cục thực tế khi chụp cạnh idol"
        >
          <EyeOutlined /> {customerPreview ? 'Đang xem trước khách' : 'Xem thử khách chụp'}
        </button>
        <button
          id="fe-save-template-header-btn"
          onClick={() => {
            setTplName(frameName || '');
            setSaveTplOpen(true);
          }}
          className={`${tbBtn} border border-pink-200 text-[#d81e69] bg-pink-50/70 hover:bg-pink-100`}
        >
          <SaveOutlined /> Lưu Mẫu
        </button>
        <button id="fe-download" onClick={handleDownload} disabled={busy} className={`${tbBtn} border border-gray-300 text-gray-700 hover:bg-gray-50`}>
          <DownloadOutlined /> Tải PNG
        </button>
        <button
          id="fe-publish"
          onClick={() => setPublishOpen(true)}
          disabled={busy}
          className={`${tbBtn} bg-[#d81e69] hover:bg-[#c01a5d] text-white shadow-md`}
        >
          <CloudUploadOutlined /> Xuất bản
        </button>
      </header>

      {/* Workspace */}
      <div className="flex-1 min-h-0 flex">
        <ToolSidebar />
        <EditorCanvas stageRef={stageRef} />
        <PropertiesPanel />
      </div>

      <PublishModal
        open={publishOpen}
        publishing={busy}
        onCancel={() => !busy && setPublishOpen(false)}
        onSubmit={handlePublish}
      />

      {/* Modal Lưu Mẫu Frame */}
      <Modal
        title="Lưu thiết kế hiện tại thành Mẫu Frame"
        open={saveTplOpen}
        onOk={handleSaveAsTemplate}
        onCancel={() => setSaveTplOpen(false)}
        okText="Lưu vào Thư Viện Mẫu"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#d81e69]' }}
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Tên Mẫu Frame *</label>
            <Input
              placeholder="VD: Frame Kỷ Niệm 1944, Frame Noel, Frame Sinh Nhật..."
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả (tùy chọn)</label>
            <Input.TextArea
              rows={2}
              placeholder="VD: Khung 3 ô bo tròn kèm tem dán và cờ hoa..."
              value={tplDesc}
              onChange={(e) => setTplDesc(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Mẫu sau khi lưu sẽ được lưu vào mục <strong>"Mẫu của tôi"</strong> ở thanh công cụ bên trái để bạn áp dụng cho các frame khác bất cứ lúc nào mà không bị ràng buộc!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default FrameEditorPage;
