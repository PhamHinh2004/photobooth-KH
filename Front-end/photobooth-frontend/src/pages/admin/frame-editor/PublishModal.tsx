import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { typeStylesAdminApi, type TypeStyle } from '@/api/type-styles.admin.api';
import { useEditorStore } from './editor.store';
import { getSlots, validateDoc } from './exportFrame';
import { ASPECT_RATIO_OPTIONS } from './types';

export interface PublishValues {
  name: string;
  sessionType: 'single' | 'group' | 'both';
  typeStyleId?: string;
  aspectRatio?: string;
}

interface Props {
  open: boolean;
  publishing: boolean;
  onCancel: () => void;
  onSubmit: (values: PublishValues) => void;
}

const PublishModal: React.FC<Props> = ({ open, publishing, onCancel, onSubmit }) => {
  const doc = useEditorStore((s) => s.doc);
  const frameName = useEditorStore((s) => s.frameName);
  const setFrameName = useEditorStore((s) => s.setFrameName);
  const currentAspectRatio = useEditorStore((s) => s.currentAspectRatio);

  const [sessionType, setSessionType] = useState<PublishValues['sessionType']>('both');
  const [typeStyleId, setTypeStyleId] = useState<string | undefined>();
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(currentAspectRatio || '1x4');
  const [typeStyles, setTypeStyles] = useState<TypeStyle[]>([]);

  useEffect(() => {
    if (!open) return;
    if (currentAspectRatio) {
      setAspectRatio(currentAspectRatio);
    }
    typeStylesAdminApi
      .getStats()
      .then((res) => setTypeStyles(res.items))
      .catch(() => setTypeStyles([]));
  }, [open, currentAspectRatio]);


  const { errors, warnings } = useMemo(() => validateDoc(doc), [doc]);
  const slotCount = getSlots(doc).length;
  const nameMissing = !frameName.trim();
  const canSubmit = !errors.length && !nameMissing && !publishing;

  return (
    <Modal
      open={open}
      title={<span className="font-bold text-lg">Xuất bản Frame lên Kiosk</span>}
      onCancel={onCancel}
      onOk={() => onSubmit({ name: frameName.trim(), sessionType, typeStyleId, aspectRatio })}
      okText="Xuất bản"
      cancelText="Huỷ"
      confirmLoading={publishing}
      okButtonProps={{ disabled: !canSubmit, id: 'fe-publish-confirm', style: canSubmit ? { background: '#d81e69' } : undefined }}
      destroyOnHidden
    >
      <div className="space-y-4 py-2">
        <label className="block">
          <div className="text-xs font-bold text-gray-700 mb-1">
            Tên frame <span className="text-[#d81e69]">*</span>
          </div>
          <input
            id="fe-publish-name"
            value={frameName}
            onChange={(e) => setFrameName(e.target.value)}
            placeholder="VD: Sweet Moments"
            className="w-full border-b-2 border-gray-300 focus:border-[#d81e69] outline-none py-1.5 font-medium transition-colors"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1">Loại phiên chụp</div>
            <Select
              value={sessionType}
              onChange={setSessionType}
              className="w-full"
              options={[
                { value: 'both', label: 'Cả đơn & nhóm' },
                { value: 'single', label: 'Chụp đơn' },
                { value: 'group', label: 'Chụp nhóm' },
              ]}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1">Type style</div>
            <Select
              value={typeStyleId}
              onChange={setTypeStyleId}
              allowClear
              placeholder="Không chọn"
              className="w-full"
              options={typeStyles.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-gray-700 mb-1">Aspect ratio (tuỳ chọn)</div>
          <Select
            value={aspectRatio}
            onChange={setAspectRatio}
            allowClear
            placeholder="Không chỉ định (kích thước tuỳ chỉnh)"
            className="w-full"
            options={ASPECT_RATIO_OPTIONS.map((a) => ({ value: a, label: a }))}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Chọn nếu muốn frame xuất hiện trong danh sách lọc theo aspect ratio ở kiosk.
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Kích thước</span>
            <b className="font-mono">
              {doc.canvas.width}×{doc.canvas.height}px
            </b>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Số ô ảnh</span>
            <b>{slotCount}</b>
          </div>
          {errors.map((e) => (
            <div key={e} className="flex gap-2 text-red-600">
              <CloseCircleFilled className="mt-0.5" /> {e}
            </div>
          ))}
          {warnings.map((w) => (
            <div key={w} className="flex gap-2 text-amber-600">
              <ExclamationCircleFilled className="mt-0.5" /> {w}
            </div>
          ))}
          {!errors.length && !warnings.length && (
            <div className="flex gap-2 text-teal-600">
              <CheckCircleFilled className="mt-0.5" /> Frame hợp lệ, sẵn sàng xuất bản.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PublishModal;
