import React from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
  ScissorOutlined,
} from '@ant-design/icons';

import { message } from 'antd';
import { smartRemoveBackground } from './bgRemoval';
import { useEditorStore } from './editor.store';
import { FONT_FAMILIES, type EditorObject, type ImageObject, type ShapeObject, type SlotObject, type TextObject } from './types';
import { IDOL_PHOTO_STAR_PRESETS } from './presets';


const inputCls =
  'w-full bg-gray-100 rounded-md px-2 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#d81e69] outline-none hover:bg-gray-200 transition-colors';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="px-4 py-4 border-b border-gray-100">
    <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-3">{title}</h4>
    {children}
  </section>
);

const IconBtn: React.FC<{ title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }> = ({
  title,
  onClick,
  children,
  danger,
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`flex-1 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center transition-colors ${
      danger ? 'hover:bg-red-100 hover:text-red-600' : 'hover:bg-pink-100 hover:text-[#d81e69]'
    }`}
  >
    {children}
  </button>
);

const PropertiesPanel: React.FC = () => {
  const doc = useEditorStore((s) => s.doc);
  const selection = useEditorStore((s) => s.selection);
  const updateObjects = useEditorStore((s) => s.updateObjects);
  const removeObjects = useEditorStore((s) => s.removeObjects);
  const duplicateObjects = useEditorStore((s) => s.duplicateObjects);
  const reorder = useEditorStore((s) => s.reorder);
  const attachIdolToSlot = useEditorStore((s) => s.attachIdolToSlot);
  const removeIdolFromSlot = useEditorStore((s) => s.removeIdolFromSlot);
  const customUploads = useEditorStore((s) => s.customUploads);

  const [removingBg, setRemovingBg] = React.useState(false);

  const selected = doc.objects.filter((o) => selection.includes(o.id));

  if (!selected.length) {
    return (
      <aside className="w-72 shrink-0 bg-white border-l border-gray-200 p-6 text-center text-xs text-gray-400 leading-relaxed">
        <div className="text-3xl mb-2">🖱️</div>
        Chọn một đối tượng trên canvas để chỉnh thuộc tính.
        <div className="mt-4 text-[11px] text-gray-300 text-left space-y-1">
          <div>Shift + click: chọn nhiều</div>
          <div>Ctrl + lăn chuột: zoom</div>
          <div>Del: xoá · Ctrl+D: nhân bản</div>
          <div>Ctrl+Z / Ctrl+Y: hoàn tác / làm lại</div>
          <div>Phím mũi tên: dịch 1px (Shift: 10px)</div>
        </div>
      </aside>
    );
  }

  const ids = selected.map((o) => o.id);
  const single = selected.length === 1 ? selected[0] : null;
  const patch = (p: Partial<EditorObject>, key: string) => updateObjects(ids, p, `prop-${ids.join(',')}-${key}`);

  const num = (label: string, field: 'x' | 'y' | 'width' | 'height' | 'rotation', disabled = false) => {
    if (!single) return null;
    return (
      <label className="text-[10px] text-gray-500 uppercase font-bold">
        {label}
        <input
          type="number"
          disabled={disabled}
          value={Math.round(single[field] as number)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (Number.isNaN(v)) return;
            const minSize = field === 'width' || field === 'height' ? Math.max(1, v) : v;
            patch({ [field]: minSize } as Partial<EditorObject>, field);
          }}
          className={`${inputCls} mt-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        />
      </label>
    );
  };

  const alignTo = (axis: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => {
    if (!single) return;
    const { width: cw, height: ch } = doc.canvas;
    const w = single.width;
    const h = single.type === 'text' ? 0 : single.height;
    const map = {
      left: { x: 0 },
      centerX: { x: Math.round((cw - w) / 2) },
      right: { x: Math.round(cw - w) },
      top: { y: 0 },
      centerY: { y: Math.round((ch - h) / 2) },
      bottom: { y: Math.round(ch - h) },
    } as const;
    updateObjects([single.id], map[axis] as Partial<EditorObject>);
  };

  const shape = single?.type === 'shape' ? (single as ShapeObject) : null;
  const text = single?.type === 'text' ? (single as TextObject) : null;
  const imgObj = single?.type === 'image' ? (single as ImageObject) : null;
  const slot = single?.type === 'slot' ? (single as SlotObject) : null;
  const attachedIdol = slot
    ? (doc.objects.find((o) => o.type === 'image' && (o as ImageObject).slotId === slot.id) as ImageObject | undefined)
    : undefined;
  const allSlots = doc.objects.filter((o) => o.type === 'slot') as SlotObject[];
  const strokeTarget = shape ?? text;
  const shadowTarget = shape ?? text;
  const isTextOnly = single?.type === 'text';

  const handleRemoveBg = async (target: ImageObject) => {
    try {
      setRemovingBg(true);
      message.loading({ content: 'Đang phân tích và tách phông nền trong suốt...', key: 'ai-rmbg', duration: 0 });
      const result = await smartRemoveBackground(target.src, {
        method: 'smart-solid',
        tolerance: 38,
        onProgress: (_pct, text) => {
          message.loading({ content: text, key: 'ai-rmbg', duration: 0 });
        },
      });
      patch({ src: result.dataUrl } as Partial<EditorObject>, 'rmbg');
      message.success({ content: 'Đã tách nền thành công!', key: 'ai-rmbg', duration: 3 });
    } catch (err) {
      console.error('Lỗi tách nền:', err);
      message.error({ content: 'Không thể tách nền ảnh này.', key: 'ai-rmbg', duration: 3 });
    } finally {
      setRemovingBg(false);
    }
  };

  return (
    <aside className="w-72 shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">
          {single
            ? { slot: 'Ô ảnh (Slot)', shape: 'Hình khối', text: 'Văn bản', image: 'Hình ảnh' }[single.type]
            : `${selected.length} đối tượng`}
        </div>
      </div>

      <Section title="Thao tác">
        <div className="flex gap-1.5">
          <IconBtn title="Nhân bản (Ctrl+D)" onClick={() => duplicateObjects(ids)}>
            <CopyOutlined />
          </IconBtn>
          <IconBtn title="Lên một lớp" onClick={() => reorder(ids, 'forward')}>
            <ArrowUpOutlined />
          </IconBtn>
          <IconBtn title="Xuống một lớp" onClick={() => reorder(ids, 'backward')}>
            <ArrowDownOutlined />
          </IconBtn>
          <IconBtn title="Lên trên cùng" onClick={() => reorder(ids, 'front')}>
            <VerticalAlignTopOutlined />
          </IconBtn>
          <IconBtn title="Xuống dưới cùng" onClick={() => reorder(ids, 'back')}>
            <VerticalAlignBottomOutlined />
          </IconBtn>
          <IconBtn title="Xoá (Del)" onClick={() => removeObjects(ids)} danger>
            <DeleteOutlined />
          </IconBtn>
        </div>
      </Section>

      {single && (
        <>
          <Section title="Căn theo canvas">
            <div className="flex gap-1.5">
              <IconBtn title="Căn trái" onClick={() => alignTo('left')}>
                <AlignLeftOutlined />
              </IconBtn>
              <IconBtn title="Căn giữa ngang" onClick={() => alignTo('centerX')}>
                <AlignCenterOutlined />
              </IconBtn>
              <IconBtn title="Căn phải" onClick={() => alignTo('right')}>
                <AlignRightOutlined />
              </IconBtn>
              {!isTextOnly && (
                <>
                  <IconBtn title="Căn trên" onClick={() => alignTo('top')}>
                    <VerticalAlignTopOutlined />
                  </IconBtn>
                  <IconBtn title="Căn giữa dọc" onClick={() => alignTo('centerY')}>
                    <VerticalAlignMiddleOutlined />
                  </IconBtn>
                  <IconBtn title="Căn dưới" onClick={() => alignTo('bottom')}>
                    <VerticalAlignBottomOutlined />
                  </IconBtn>
                </>
              )}
            </div>
          </Section>

          <Section title="Vị trí & Kích thước (px)">
            <div className="grid grid-cols-2 gap-3">
              {num('X', 'x')}
              {num('Y', 'y')}
              {num('Rộng', 'width')}
              {num('Cao', 'height', isTextOnly)}
              {num('Xoay (°)', 'rotation', single.type === 'slot')}
            </div>
            {single.type === 'slot' && (
              <p className="text-[10px] text-gray-400 mt-2">Slot luôn là hình chữ nhật thẳng (không xoay).</p>
            )}
          </Section>
        </>
      )}

      <Section title="Độ mờ">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={single ? single.opacity : selected[0].opacity}
          onChange={(e) => patch({ opacity: parseFloat(e.target.value) }, 'opacity')}
          className="w-full accent-[#d81e69]"
        />
      </Section>

      {slot && (
        <Section title="Khung & Bo góc Ô ảnh">
          <div className="space-y-3">
            <label className="block text-xs text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Bo góc ô ảnh (Radius):</span>
                <span className="font-mono text-[11px] text-[#d81e69] font-bold">{slot.cornerRadius ?? 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={slot.cornerRadius ?? 0}
                onChange={(e) => patch({ cornerRadius: parseInt(e.target.value, 10) } as Partial<EditorObject>, 'slotRadius')}
                className="w-full accent-[#d81e69]"
              />
            </label>

            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Màu viền ô ảnh</span>
                <input
                  type="color"
                  value={slot.stroke || '#ffffff'}
                  onChange={(e) => patch({ stroke: e.target.value } as Partial<EditorObject>, 'slotStroke')}
                  className="w-8 h-6 rounded border border-gray-200 cursor-pointer"
                />
              </label>

              <label className="block text-xs text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Độ dày viền:</span>
                  <span className="font-mono text-[11px] text-[#d81e69] font-bold">{slot.strokeWidth ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={slot.strokeWidth ?? 0}
                  onChange={(e) => patch({ strokeWidth: parseInt(e.target.value, 10) } as Partial<EditorObject>, 'slotStrokeWidth')}
                  className="w-full accent-[#d81e69]"
                />
              </label>
            </div>
            <p className="text-[10px] text-gray-400">
              Ô ảnh khi xuất bản sẽ được đục lỗ trong suốt bo góc và viền bao quanh theo đúng cài đặt trên.
            </p>
          </div>
        </Section>
      )}

      {slot && (
        <Section title="👤 Ghép Idol / Nhân vật vào Ô này">
          {attachedIdol ? (
            <div className="space-y-3 bg-pink-50/50 p-2.5 rounded-xl border border-pink-100">
              <div className="flex gap-2.5 items-center">
                <div className="w-12 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-0.5 overflow-hidden shadow-xs shrink-0">
                  <img src={attachedIdol.src} alt={attachedIdol.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-gray-800 truncate">{attachedIdol.name}</h5>
                  <span className="text-[10px] text-[#d81e69] font-medium block">
                    Vị trí: {attachedIdol.positionInSlot === 'left' ? '👈 Đứng Bên Trái' : '👉 Bên Phải'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Đổi vị trí đứng:</label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const newX = slot.x;
                      updateObjects([attachedIdol.id], { x: newX, positionInSlot: 'left' });
                    }}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors ${
                      attachedIdol.positionInSlot === 'left'
                        ? 'bg-[#d81e69] text-white border-[#d81e69]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    👈 Bên Trái
                  </button>
                  <button
                    onClick={() => {
                      const newX = slot.x + slot.width - attachedIdol.width;
                      updateObjects([attachedIdol.id], { x: newX, positionInSlot: 'right' });
                    }}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors ${
                      attachedIdol.positionInSlot === 'right'
                        ? 'bg-[#d81e69] text-white border-[#d81e69]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    👉 Bên Phải
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updateObjects([attachedIdol.id], { flipX: !attachedIdol.flipX })}
                  className="flex-1 py-1.5 px-2 rounded bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 transition-colors"
                >
                  ↔️ Lật hướng
                </button>
                <button
                  onClick={() => removeIdolFromSlot(slot.id)}
                  className="py-1.5 px-2.5 rounded bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                  title="Gỡ Idol khỏi ô này"
                >
                  <DeleteOutlined /> Gỡ
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Ghép thần tượng / nhân vật đứng cạnh vị trí khách chụp (y hệt mẫu Photo Star).
              </p>

              <div>
                <span className="text-[10px] font-bold text-gray-600 block mb-1">Chọn nhanh Idol Photo Star:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {IDOL_PHOTO_STAR_PRESETS.map((idol) => (
                    <button
                      key={idol.id}
                      onClick={() =>
                        attachIdolToSlot(slot.id, idol.src, idol.defaultPosition, idol.width, idol.height, idol.flipX)
                      }
                      title={`Ghép ${idol.name} vào ô này`}
                      className="p-1 rounded-lg bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-[#d81e69] flex flex-col items-center transition-all group"
                    >
                      <div className="w-8 h-10 flex items-center justify-center overflow-hidden">
                        <img src={idol.src} alt={idol.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[8px] text-gray-600 group-hover:text-[#d81e69] font-medium truncate w-full mt-0.5">
                        {idol.badge || 'Idol'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {customUploads.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-600 block mb-1">Hoặc từ ảnh tải lên của bạn:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {customUploads.slice(0, 6).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => attachIdolToSlot(slot.id, u.src, 'right', u.width, u.height)}
                        title={`Ghép "${u.name}" vào ô này`}
                        className="w-10 h-10 shrink-0 rounded border border-gray-200 hover:border-[#d81e69] p-0.5 bg-gray-50 flex items-center justify-center overflow-hidden transition-all"
                      >
                        <img src={u.src} alt={u.name} className="max-w-full max-h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {shape && (
        <Section title="Hình khối">
          <div className="space-y-3">
            <label className="flex items-center justify-between text-xs text-gray-600">
              Màu nền
              <input
                type="color"
                value={shape.fill}
                onChange={(e) => patch({ fill: e.target.value } as Partial<EditorObject>, 'fill')}
                className="w-10 h-7 rounded border border-gray-200 cursor-pointer"
              />
            </label>
            {shape.shape === 'rect' && (
              <label className="block text-xs text-gray-600">
                Bo góc: {shape.cornerRadius}px
                <input
                  type="range"
                  min={0}
                  max={Math.round(Math.min(shape.width, shape.height) / 2)}
                  value={shape.cornerRadius}
                  onChange={(e) => patch({ cornerRadius: parseInt(e.target.value, 10) } as Partial<EditorObject>, 'radius')}
                  className="w-full accent-[#d81e69]"
                />
              </label>
            )}
          </div>
        </Section>
      )}

      {text && (
        <Section title="Văn bản">
          <div className="space-y-3">
            <textarea
              rows={3}
              value={text.text}
              onChange={(e) => patch({ text: e.target.value } as Partial<EditorObject>, 'text')}
              className="w-full bg-gray-100 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#d81e69] outline-none resize-none"
            />
            <select
              value={text.fontFamily}
              onChange={(e) => patch({ fontFamily: e.target.value } as Partial<EditorObject>, 'font')}
              className="w-full bg-gray-100 rounded-md px-2 py-1.5 text-sm outline-none"
              style={{ fontFamily: text.fontFamily }}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] text-gray-500 uppercase font-bold">
                Cỡ chữ
                <input
                  type="number"
                  min={6}
                  value={text.fontSize}
                  onChange={(e) =>
                    patch({ fontSize: Math.max(6, parseInt(e.target.value, 10) || 6) } as Partial<EditorObject>, 'fontSize')
                  }
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="text-[10px] text-gray-500 uppercase font-bold">
                Màu chữ
                <input
                  type="color"
                  value={text.fill}
                  onChange={(e) => patch({ fill: e.target.value } as Partial<EditorObject>, 'fill')}
                  className="block w-full h-[30px] mt-1 rounded border border-gray-200 cursor-pointer"
                />
              </label>
            </div>
            <div className="flex gap-1.5">
              {(['bold', 'italic'] as const).map((s) => {
                const on = text.fontStyle.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                      const b = s === 'bold' ? !on : text.fontStyle.includes('bold');
                      const i = s === 'italic' ? !on : text.fontStyle.includes('italic');
                      const fontStyle = (i && b ? 'italic bold' : i ? 'italic' : b ? 'bold' : 'normal') as TextObject['fontStyle'];
                      patch({ fontStyle } as Partial<EditorObject>, 'fontStyle');
                    }}
                    className={`flex-1 h-8 rounded-md text-sm transition-colors ${
                      on ? 'bg-[#d81e69] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${s === 'bold' ? 'font-bold' : 'italic'}`}
                  >
                    {s === 'bold' ? 'B' : 'I'}
                  </button>
                );
              })}
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => patch({ align: a } as Partial<EditorObject>, 'align')}
                  className={`flex-1 h-8 rounded-md transition-colors ${
                    text.align === a ? 'bg-[#d81e69] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {a === 'left' ? <AlignLeftOutlined /> : a === 'center' ? <AlignCenterOutlined /> : <AlignRightOutlined />}
                </button>
              ))}
            </div>
          </div>
        </Section>
      )}

      {imgObj && (
        <Section title="Ảnh & Nhân vật">
          <div className="space-y-3">
            {imgObj.slotId && (
              <div className="p-2.5 rounded-lg bg-pink-50 border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#d81e69] flex items-center gap-1">
                    👤 Đang ghép vào Ô ảnh
                  </span>
                  <button
                    onClick={() => patch({ slotId: undefined, clipToSlot: false, positionInSlot: undefined }, 'detachSlot')}
                    className="text-[10px] text-gray-500 hover:text-red-500 underline"
                  >
                    Tách thành sticker
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const s = doc.objects.find((o) => o.id === imgObj.slotId && o.type === 'slot') as SlotObject | undefined;
                      if (!s) return;
                      patch({ x: s.x, positionInSlot: 'left' }, 'posLeft');
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded border ${
                      imgObj.positionInSlot === 'left' ? 'bg-[#d81e69] text-white border-[#d81e69]' : 'bg-white text-gray-700'
                    }`}
                  >
                    👈 Đứng Trái
                  </button>
                  <button
                    onClick={() => {
                      const s = doc.objects.find((o) => o.id === imgObj.slotId && o.type === 'slot') as SlotObject | undefined;
                      if (!s) return;
                      patch({ x: s.x + s.width - imgObj.width, positionInSlot: 'right' }, 'posRight');
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded border ${
                      imgObj.positionInSlot === 'right' ? 'bg-[#d81e69] text-white border-[#d81e69]' : 'bg-white text-gray-700'
                    }`}
                  >
                    👉 Đứng Phải
                  </button>
                </div>
              </div>
            )}

            {!imgObj.slotId && allSlots.length > 0 && (
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-[11px] font-bold text-gray-700 block">👤 Ghép ảnh này vào Ô ảnh:</span>
                <div className="flex flex-wrap gap-1">
                  {allSlots.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        attachIdolToSlot(s.id, imgObj.src, 'right', imgObj.width, imgObj.height, imgObj.flipX)
                      }
                      className="px-2 py-1 text-[10px] font-bold rounded bg-white hover:bg-pink-50 hover:text-[#d81e69] border border-gray-200 transition-colors"
                    >
                      Ô #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => patch({ flipX: !imgObj.flipX } as Partial<EditorObject>, 'flipX')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold border transition-colors ${
                  imgObj.flipX ? 'bg-pink-50 border-[#d81e69] text-[#d81e69]' : 'bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lật ngang ↔
              </button>
              <button
                onClick={() => patch({ flipY: !imgObj.flipY } as Partial<EditorObject>, 'flipY')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold border transition-colors ${
                  imgObj.flipY ? 'bg-pink-50 border-[#d81e69] text-[#d81e69]' : 'bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lật dọc ↕
              </button>
            </div>

            <button
              disabled={removingBg}
              onClick={() => handleRemoveBg(imgObj)}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-[#d81e69] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              <ScissorOutlined /> {removingBg ? 'Đang tách nền AI...' : 'Tách nền AI (Xóa phông)'}
            </button>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Tách nền tự động bằng AI giúp tạo nhân vật/idol dạng sticker không nền để ghép vào frame.
            </p>
          </div>
        </Section>
      )}

      {strokeTarget && (
        <Section title="Viền">

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={strokeTarget.stroke}
              onChange={(e) => patch({ stroke: e.target.value } as Partial<EditorObject>, 'stroke')}
              className="w-10 h-7 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="range"
              min={0}
              max={40}
              value={strokeTarget.strokeWidth}
              onChange={(e) => patch({ strokeWidth: parseInt(e.target.value, 10) } as Partial<EditorObject>, 'strokeWidth')}
              className="flex-1 accent-[#d81e69]"
            />
            <span className="text-[11px] font-mono text-gray-500 w-8 text-right">{strokeTarget.strokeWidth}px</span>
          </div>
        </Section>
      )}

      {shadowTarget && (
        <Section title="Bóng đổ">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={shadowTarget.shadowColor}
              onChange={(e) => patch({ shadowColor: e.target.value } as Partial<EditorObject>, 'shadowColor')}
              className="w-10 h-7 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="range"
              min={0}
              max={60}
              value={shadowTarget.shadowBlur}
              onChange={(e) => patch({ shadowBlur: parseInt(e.target.value, 10) } as Partial<EditorObject>, 'shadowBlur')}
              className="flex-1 accent-[#d81e69]"
            />
            <span className="text-[11px] font-mono text-gray-500 w-8 text-right">{shadowTarget.shadowBlur}</span>
          </div>
        </Section>
      )}
    </aside>
  );
};

export default PropertiesPanel;
