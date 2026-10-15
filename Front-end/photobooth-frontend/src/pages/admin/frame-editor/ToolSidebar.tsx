import React, { useEffect, useRef, useState } from 'react';
import {
  AppstoreAddOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FontSizeOutlined,
  LockOutlined,
  PictureOutlined,
  UnlockOutlined,
  UploadOutlined,
  BlockOutlined,
  LayoutOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  SmileOutlined,
  ScissorOutlined,
  LoadingOutlined,
  SearchOutlined,
  FireOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  StarFilled,
  EditOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { message, Switch, Input, Modal, Select, Slider, Radio } from 'antd';
import { smartRemoveBackground } from './bgRemoval';
import { adminApi } from '@/api/admin.api';
import { useEditorStore } from './editor.store';
import {
  type CanvasBackground,
  type CustomUploadItem,
  type EditorObject,
  type ShapeKind,
  type SlotObject,
} from './types';
import {
  BASE_FRAME_PRESETS,
  PRESET_BACKGROUNDS,
  PRESET_CHARACTERS_AND_STICKERS,
  PRESET_TEMPLATES,
  IDOL_PHOTO_STAR_PRESETS,
  type AssetCategory,
  type BaseFrameLayout,
  type PresetAsset,
} from './presets';
import { requestFitZoom } from './EditorCanvas';


type Tab = 'templates' | 'uploads' | 'stickers' | 'elements' | 'canvas' | 'layers';

const SHAPES: { kind: ShapeKind; label: string; icon: React.ReactNode }[] = [
  { kind: 'rect', label: 'Chữ nhật', icon: <div className="w-7 h-5 bg-current rounded-sm" /> },
  { kind: 'ellipse', label: 'Elip', icon: <div className="w-6 h-6 bg-current rounded-full" /> },
  {
    kind: 'triangle',
    label: 'Tam giác',
    icon: (
      <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-current" />
    ),
  },
  { kind: 'star', label: 'Ngôi sao', icon: <span className="text-2xl leading-none">★</span> },
  { kind: 'heart', label: 'Trái tim', icon: <span className="text-2xl leading-none">♥</span> },
];

const OBJECT_LABEL: Record<EditorObject['type'], string> = {
  slot: 'Ô ảnh',
  shape: 'Hình',
  text: 'Văn bản',
  image: 'Ảnh / Nhãn',
};

// ==========================================
// TAB 1: MẪU FRAME THIẾT KẾ (TỰ TẠO & CÓ SẴN)
// ==========================================
const TemplatesTab: React.FC = () => {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const customTemplates = useEditorStore((s) => s.customTemplates);
  const saveCustomTemplate = useEditorStore((s) => s.saveCustomTemplate);
  const deleteCustomTemplate = useEditorStore((s) => s.deleteCustomTemplate);

  const [subTab, setSubTab] = useState<'my' | 'preset'>('my');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');

  const handleSave = () => {
    if (!tplName.trim()) {
      message.warning('Vui lòng nhập tên mẫu frame');
      return;
    }
    saveCustomTemplate(tplName, tplDesc);
    message.success(`Đã lưu mẫu "${tplName}" vào kho mẫu của bạn!`);
    setSaveModalOpen(false);
    setTplName('');
    setTplDesc('');
    setSubTab('my');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customTemplates, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `photobooth_my_templates_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Nút lưu mẫu hiện tại */}
      <button
        id="fe-save-template-sidebar-btn"
        onClick={() => setSaveModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d81e69] to-[#ff7a45] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
      >
        <PlusOutlined /> Lưu thiết kế hiện tại thành Mẫu
      </button>

      {/* Sub tabs: Mẫu của tôi vs Mẫu có sẵn */}
      <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-bold">
        <button
          onClick={() => setSubTab('my')}
          className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'my' ? 'bg-white shadow text-[#d81e69]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <FolderOpenOutlined /> Mẫu của tôi ({customTemplates.length})
        </button>
        <button
          onClick={() => setSubTab('preset')}
          className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            subTab === 'preset' ? 'bg-white shadow text-[#d81e69]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <StarFilled /> Mẫu có sẵn ({PRESET_TEMPLATES.length})
        </button>
      </div>

      {/* 1. MẪU CỦA TÔI */}
      {subTab === 'my' && (
        <div className="space-y-3">
          {customTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group rounded-xl border border-gray-200 hover:border-[#d81e69] p-3 transition-all hover:shadow-md bg-white relative overflow-hidden"
            >
              <div className="flex gap-3 items-center">
                <div
                  className="w-12 h-20 rounded-lg shrink-0 border border-gray-200 flex items-center justify-center shadow-inner overflow-hidden"
                  style={{ backgroundColor: tpl.preview || '#e0e0e0' }}
                >
                  <div className="w-8 h-16 rounded bg-white/30 border border-white/50 flex flex-col justify-around p-0.5">
                    <div className="h-3 bg-white/50 rounded-xs" />
                    <div className="h-3 bg-white/50 rounded-xs" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-gray-800 group-hover:text-[#d81e69] truncate">
                      {tpl.name}
                    </h5>
                    <button
                      title="Xóa mẫu"
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: `Xóa mẫu "${tpl.name}"?`,
                          okText: 'Xóa',
                          cancelText: 'Hủy',
                          okButtonProps: { danger: true },
                          onOk: () => deleteCustomTemplate(tpl.id),
                        });
                      }}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                    {tpl.description || 'Mẫu tự thiết kế'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadTemplate(tpl.doc, tpl.name);
                        message.success(`Đã nạp mẫu: ${tpl.name}!`);
                      }}
                      className="text-[10px] font-bold text-white bg-[#d81e69] hover:bg-[#c01a5d] px-2.5 py-1 rounded-md transition-colors shadow-xs"
                    >
                      Áp dụng mẫu ➜
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {customTemplates.length === 0 && (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <div className="text-3xl mb-2">🎨</div>
              <div className="text-xs font-bold text-gray-700">Chưa có mẫu tự tạo nào</div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Bạn có thể tự do tạo bố cục khung bất kỳ, rồi bấm nút <strong>"Lưu thiết kế hiện tại thành Mẫu"</strong> để lưu lại dùng mãi mãi!
              </p>
            </div>
          )}

          {customTemplates.length > 0 && (
            <button
              onClick={handleExportJson}
              className="w-full py-2 text-[11px] font-bold text-gray-600 hover:text-[#d81e69] bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <DownloadOutlined /> Xuất file sao lưu (JSON)
            </button>
          )}
        </div>
      )}

      {/* 2. MẪU CÓ SẴN (PRESETS) */}
      {subTab === 'preset' && (
        <div className="space-y-3">
          {PRESET_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                loadTemplate(tpl.doc, tpl.name);
                message.success(`Đã nạp mẫu: ${tpl.name}! Bạn có thể chỉnh sửa mọi thành phần.`);
              }}
              className="group cursor-pointer rounded-xl border border-gray-200 hover:border-[#d81e69] p-3 transition-all hover:shadow-md bg-white relative overflow-hidden"
            >
              {tpl.id === 'photo-star-kpop-strip' && (
                <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  ⭐ Mẫu Photo Star (Idol)
                </span>
              )}
              {tpl.id === 'vietnam-heritage-1944' && (
                <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider bg-red-600 text-yellow-300 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <FireOutlined /> Mẫu Quân Đội 1944
                </span>
              )}
              <div className="flex gap-3 items-center">
                <div
                  className="w-12 h-20 rounded-lg shrink-0 border border-gray-200 flex items-center justify-center shadow-inner overflow-hidden"
                  style={{ backgroundColor: tpl.preview }}
                >
                  <div className="w-8 h-16 rounded bg-white/20 border border-white/40 flex flex-col justify-around p-0.5">
                    <div className="h-3 bg-white/40 rounded-xs" />
                    <div className="h-3 bg-white/40 rounded-xs" />
                    <div className="h-3 bg-white/40 rounded-xs" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-gray-800 group-hover:text-[#d81e69] transition-colors truncate">
                    {tpl.name}
                  </h5>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#d81e69] bg-pink-50 px-2 py-0.5 rounded-md group-hover:bg-[#d81e69] group-hover:text-white transition-colors">
                      Áp dụng mẫu này ➜
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lưu Mẫu */}
      <Modal
        title="Lưu thiết kế hiện tại thành Mẫu Frame"
        open={saveModalOpen}
        onOk={handleSave}
        onCancel={() => setSaveModalOpen(false)}
        okText="Lưu vào Thư Viện Mẫu"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#d81e69]' }}
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Tên Mẫu Frame *</label>
            <Input
              placeholder="VD: Frame Kỷ Niệm 1944, Frame Noel 2024..."
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả (tùy chọn)</label>
            <Input.TextArea
              rows={2}
              placeholder="VD: 3 ô ảnh bo góc, hoa văn cờ hoa, phong cách trang trọng..."
              value={tplDesc}
              onChange={(e) => setTplDesc(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Mẫu sau khi lưu sẽ xuất hiện trong tab <strong>"Mẫu của tôi"</strong> để bạn sử dụng lại bất kỳ lúc nào!
          </p>
        </div>
      </Modal>
    </div>
  );
};

const resizeImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1000;
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 300;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(e.target?.result));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88));
      };
      img.onerror = () => resolve(String(e.target?.result));
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  });
};

// ==========================================
// TAB 2: TẢI LÊN & QUẢN LÝ KHO HÌNH ẢNH (UPLOADS)
// ==========================================
const UploadsTab: React.FC = () => {
  const doc = useEditorStore((s) => s.doc);
  const addImage = useEditorStore((s) => s.addImage);
  const customUploads = useEditorStore((s) => s.customUploads);
  const addCustomUpload = useEditorStore((s) => s.addCustomUpload);
  const updateCustomUpload = useEditorStore((s) => s.updateCustomUpload);
  const deleteCustomUpload = useEditorStore((s) => s.deleteCustomUpload);
  const clearAllCustomUploads = useEditorStore((s) => s.clearAllCustomUploads);
  const attachIdolToSlot = useEditorStore((s) => s.attachIdolToSlot);
  const applyPhotoStarPreset = useEditorStore((s) => s.applyPhotoStarPreset);
  const loadFrameAssetsFromDb = useEditorStore((s) => s.loadFrameAssetsFromDb);

  useEffect(() => {
    loadFrameAssetsFromDb();
  }, [loadFrameAssetsFromDb]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [bgMethod, setBgMethod] = useState<'smart-solid' | 'ai'>('smart-solid');
  const [bgTolerance, setBgTolerance] = useState<number>(38);
  const [uploadCategory, setUploadCategory] = useState<CustomUploadItem['category']>('character');
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Xem ảnh lớn (Preview)
  const [previewItem, setPreviewItem] = useState<{ src: string; name: string } | null>(null);

  // Chỉnh sửa tên / loại item
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; category: CustomUploadItem['category'] } | null>(null);

  // Modal Tách phông nền chuyên sâu
  const [bgModalItem, setBgModalItem] = useState<CustomUploadItem | null>(null);
  const [bgModalPreview, setBgModalPreview] = useState<string>('');
  const [bgModalLoading, setBgModalLoading] = useState(false);
  const [bgModalTolerance, setBgModalTolerance] = useState<number>(38);
  const [bgModalMethod, setBgModalMethod] = useState<'smart-solid' | 'ai'>('smart-solid');

  const openBgModal = (item: CustomUploadItem) => {
    setBgModalItem(item);
    setBgModalTolerance(38);
    setBgModalMethod('smart-solid');
    generateCutoutPreview(item.src, 'smart-solid', 38);
  };

  const generateCutoutPreview = async (src: string, method: 'smart-solid' | 'ai', tol: number) => {
    setBgModalLoading(true);
    try {
      const res = await smartRemoveBackground(src, { method, tolerance: tol });
      setBgModalPreview(res.dataUrl);
    } catch (e) {
      console.error(e);
      message.error('Không thể tách nền ảnh này');
    } finally {
      setBgModalLoading(false);
    }
  };

  // Modal ghép idol vào slot
  const [attachModalItem, setAttachModalItem] = useState<{
    src: string;
    name: string;
    width: number;
    height: number;
    defaultPos?: 'left' | 'right';
  } | null>(null);
  const [targetSlotId, setTargetSlotId] = useState<string>('');
  const [targetPos, setTargetPos] = useState<'left' | 'right'>('right');
  const [targetFlip, setTargetFlip] = useState<boolean>(false);

  const slots = doc.objects.filter((o) => o.type === 'slot') as SlotObject[];

  const openAttachModal = (item: {
    src: string;
    name: string;
    width: number;
    height: number;
    defaultPos?: 'left' | 'right';
  }) => {
    setAttachModalItem(item);
    setTargetSlotId(slots[0]?.id || '');
    setTargetPos(item.defaultPos || 'right');
    setTargetFlip(false);
  };

  const handleConfirmAttach = () => {
    if (!attachModalItem || !targetSlotId) {
      message.warning('Vui lòng chọn một ô ảnh (slot) để ghép!');
      return;
    }
    attachIdolToSlot(
      targetSlotId,
      attachModalItem.src,
      targetPos,
      attachModalItem.width,
      attachModalItem.height,
      targetFlip
    );
    const slotIdx = slots.findIndex((s) => s.id === targetSlotId);
    message.success(
      `Đã ghép "${attachModalItem.name}" vào Ô #${slotIdx >= 0 ? slotIdx + 1 : 1} (${
        targetPos === 'left' ? 'Bên Trái' : 'Bên Phải'
      })!`
    );
    setAttachModalItem(null);
  };

  const processUploadFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    message.loading({ content: `Đang xử lý ${fileList.length} ảnh tải lên...`, key: 'upload-device', duration: 0 });

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('image/')) continue;

        const isGif = file.type === 'image/gif';
        let finalUrl = '';
        let photoRecord: any = null;
        let uploadBlob: File | Blob = file;

        if (autoRemoveBg && !isGif) {
          try {
            message.loading({
              content: `Đang tách phông nền "${file.name}" (${bgMethod === 'smart-solid' ? 'Siêu tốc 10ms' : 'AI'})...`,
              key: 'upload-device',
              duration: 0,
            });
            const cutout = await smartRemoveBackground(file, {
              method: bgMethod,
              tolerance: bgTolerance,
              onProgress: (_p, text) => {
                message.loading({ content: text, key: 'upload-device', duration: 0 });
              },
            });

            uploadBlob = cutout.blob;
            finalUrl = cutout.dataUrl;
          } catch (rmErr) {
            console.warn('Lỗi tách nền:', rmErr);
            finalUrl = await resizeImageFile(file);
          }
        }

        // Lưu vào entity Photo qua API backend
        try {
          message.loading({
            content: `Đang lưu "${file.name}" vào database Photo...`,
            key: 'upload-device',
            duration: 0,
          });
          photoRecord = await adminApi.uploadFrameAsset({
            file: uploadBlob,
            name: file.name.replace(/\.[^/.]+$/, ''),
            category: isGif ? 'gif' : uploadCategory,
            metadata: {
              is_cutout: autoRemoveBg && !isGif,
              original_filename: file.name,
            },
          });
          if (photoRecord?.processed_file_url || photoRecord?.original_file_url) {
            finalUrl = photoRecord.processed_file_url || photoRecord.original_file_url;
          }
        } catch (dbErr) {
          console.warn('Lưu vào Photo entity qua API thất bại, lưu dự phòng cục bộ:', dbErr);
          if (!finalUrl) {
            finalUrl = isGif
              ? await new Promise((res) => {
                  const reader = new FileReader();
                  reader.onload = () => res(String(reader.result));
                  reader.readAsDataURL(file);
                })
              : await resizeImageFile(file);
          }
        }

        const img = new window.Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            addCustomUpload({
              id: photoRecord?.id,
              name: photoRecord?.title || file.name.replace(/\.[^/.]+$/, ''),
              src: finalUrl,
              category: isGif ? 'gif' : uploadCategory,
              width: img.naturalWidth || 300,
              height: img.naturalHeight || 300,
              isGif,
            });
            resolve();
          };
          img.onerror = () => resolve();
          img.src = finalUrl;
        });
      }

      message.success({ content: 'Đã lưu thành công vào Kho Tải Lên & Database Photo!', key: 'upload-device', duration: 3 });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Lỗi tải ảnh từ thiết bị', key: 'upload-device', duration: 3 });
    } finally {
      setUploading(false);
    }
  };

  const filteredUploads = customUploads.filter((u) => {
    const matchCat = filterCat === 'all' || u.category === filterCat;
    const matchSearch =
      !searchQuery.trim() || u.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 space-y-4">
      {/* 💡 Mẹo kéo thả */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
        <span className="text-base leading-none">💡</span>
        <p className="text-[10px] text-amber-800 leading-relaxed m-0">
          <strong>Mẹo kéo thả:</strong> Bạn có thể <strong>nhấp giữ chuột và kéo trực tiếp</strong> ảnh bất kỳ từ danh sách bên dưới rồi thả vào <strong>Ô ảnh (Slot)</strong> hoặc thả vào <strong>vùng canvas</strong>!
        </p>
      </div>

      {/* 1. MẪU IDOL PHOTO STAR CÓ SẴN (THEO HÌNH MẪU CHUẨN) */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 border border-pink-200 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⭐</span>
            <div>
              <h4 className="text-xs font-black text-gray-800">BỘ 4 IDOL PHOTO STAR (MẪU)</h4>
              <p className="text-[10px] text-gray-500">Kéo thả hoặc ghép vào ô ảnh y hệt hình mẫu</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (slots.length === 0) {
              message.warning('Canvas chưa có ô ảnh nào! Vui lòng chọn mẫu 1x4 hoặc thêm ô ảnh.');
              return;
            }
            applyPhotoStarPreset();
            message.success('Đã tự động ghép 4 Idol Photo Star vào 4 ô ảnh!');
          }}
          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#d81e69] via-pink-600 to-[#7928ca] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer"
        >
          ✨ 1-Click: Tự động ghép 4 Idol vào 4 Ô
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {IDOL_PHOTO_STAR_PRESETS.map((idol) => (
            <div
              key={idol.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/photobooth-asset',
                  JSON.stringify({
                    src: idol.src,
                    width: idol.width,
                    height: idol.height,
                    name: idol.name,
                    category: 'character',
                  })
                );
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title="Nhấp giữ chuột để KÉO vào ô ảnh hoặc canvas!"
              className="p-2 rounded-lg bg-white border border-pink-100 flex flex-col items-center text-center shadow-xs hover:border-[#d81e69] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
            >
              <span className="absolute top-1 right-1 text-[8px] bg-pink-100 text-[#d81e69] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                ✋ Kéo thả
              </span>
              <div className="w-14 h-16 flex items-center justify-center p-0.5 mb-1 overflow-hidden pointer-events-none">
                <img src={idol.src} alt={idol.name} className="max-w-full max-h-full object-contain" />
              </div>
              <span className="text-[9.5px] font-bold text-gray-800 truncate w-full">{idol.name}</span>
              <span className="text-[8.5px] text-[#d81e69] font-medium mt-0.5">{idol.badge}</span>
              <button
                type="button"
                onClick={() =>
                  openAttachModal({
                    src: idol.src,
                    name: idol.name,
                    width: idol.width,
                    height: idol.height,
                    defaultPos: idol.defaultPosition,
                  })
                }
                className="mt-1.5 w-full py-1 text-[9px] font-bold text-[#d81e69] bg-pink-50 hover:bg-[#d81e69] hover:text-white rounded transition-colors cursor-pointer"
              >
                Ghép vào Ô ảnh...
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. BOX TẢI ẢNH MỚI TỪ THIẾT BỊ (CLICK HOẶC KÉO THẢ TỆP VÀO) */}
      <section className="bg-gradient-to-br from-indigo-50/80 via-pink-50/80 to-purple-50/80 border border-pink-100 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <CloudUploadOutlined className="text-[#d81e69]" /> Tải ảnh / Nhãn từ thiết bị
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Loại item tải lên:</span>
            <Select
              size="small"
              value={uploadCategory}
              onChange={setUploadCategory}
              className="w-36 text-xs"
              options={[
                { value: 'character', label: '👤 Nhân vật / Idol' },
                { value: 'label', label: '🏷️ Nhãn / Badge' },
                { value: 'logo', label: '🛡️ Logo / Watermark' },
                { value: 'sticker', label: '🌸 Sticker / Decor' },
                { value: 'other', label: '🎨 Khác' },
              ]}
            />
          </div>

          <div className="space-y-2 bg-white/80 p-2.5 rounded-lg border border-pink-100">
            <div className="flex items-center justify-between text-[11px] text-gray-700 font-bold">
              <span className="flex items-center gap-1.5">
                <ScissorOutlined className="text-[#d81e69]" /> Tự động tách phông nền trong suốt
              </span>
              <Switch size="small" checked={autoRemoveBg} onChange={setAutoRemoveBg} />
            </div>

            {autoRemoveBg && (
              <div className="pt-2 space-y-2 border-t border-pink-100/70">
                <div className="flex items-center justify-between text-[10.5px] text-gray-600">
                  <span>Chế độ tách:</span>
                  <Radio.Group
                    size="small"
                    value={bgMethod}
                    onChange={(e) => setBgMethod(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="smart-solid" className="text-[10px]">
                      ⚡ Siêu tốc 10ms (Nền trắng/đơn sắc)
                    </Radio.Button>
                    <Radio.Button value="ai" className="text-[10px]">
                      🤖 AI Model
                    </Radio.Button>
                  </Radio.Group>
                </div>

                {bgMethod === 'smart-solid' && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="whitespace-nowrap">Độ nhạy khử màu:</span>
                    <Slider
                      min={15}
                      max={80}
                      value={bgTolerance}
                      onChange={setBgTolerance}
                      className="flex-1 m-0"
                    />
                    <span className="w-5 text-right font-mono font-bold text-[#d81e69]">{bgTolerance}</span>
                  </div>
                )}
                <p className="text-[9.5px] text-gray-400 m-0 leading-tight">
                  {bgMethod === 'smart-solid'
                    ? '💡 Tối ưu hoàn hảo cho ảnh thẻ, chân dung nền trắng/đơn sắc mà không lẹm vào áo trắng!'
                    : '💡 Tách nền bằng mô hình học sâu AI cho mọi ảnh chân dung, phong cảnh phức tạp.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nút trải nghiệm nhanh ảnh mẫu chân dung */}
        <button
          type="button"
          onClick={async () => {
            message.loading({ content: 'Đang tách phông trắng cho ảnh chân dung mẫu áo trắng...', key: 'sample-cutout', duration: 0 });
            try {
              const res = await smartRemoveBackground('/idols/sample_portrait.jpg', { method: 'smart-solid', tolerance: 38 });
              let photoRecord: any = null;
              try {
                photoRecord = await adminApi.uploadFrameAsset({
                  file: res.blob,
                  name: 'Chân dung áo trắng (Đã tách nền)',
                  category: 'character',
                  metadata: { is_cutout: true },
                });
              } catch (e) {
                console.warn('Lưu vào Photo entity API lỗi, dùng lưu cục bộ', e);
              }

              const finalUrl = photoRecord?.processed_file_url || photoRecord?.original_file_url || res.dataUrl;

              addCustomUpload({
                id: photoRecord?.id,
                name: 'Chân dung áo trắng (Đã tách nền)',
                src: finalUrl,
                category: 'character',
                width: 300,
                height: 300,
                isGif: false,
              });
              message.success({ content: 'Đã tách nền và lưu ảnh mẫu vào Database Photo thành công!', key: 'sample-cutout', duration: 3 });
            } catch (e) {
              console.error(e);
              message.error({ content: 'Lỗi tải ảnh mẫu', key: 'sample-cutout', duration: 3 });
            }
          }}
          className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-[#d81e69]/80 bg-pink-50/70 hover:bg-pink-100 text-[#d81e69] text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          🧑‍💼 Thử ngay: Tách nền ảnh chân dung mẫu áo trắng
        </button>

        {/* Vùng Dropzone bấm vào hoặc kéo thả tệp từ máy tính */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length) processUploadFiles(files);
          }}
          className={`border-2 border-dashed rounded-xl p-3 text-center transition-all ${
            isDragging
              ? 'border-[#d81e69] bg-pink-100/70 scale-[1.01]'
              : 'border-pink-300 bg-white/70 hover:border-[#d81e69]'
          }`}
        >
          <button
            type="button"
            id="fe-upload-device-btn"
            disabled={uploading}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#d81e69] to-[#7928ca] text-white text-xs font-bold shadow hover:opacity-95 transition-opacity cursor-pointer select-none"
          >
            {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            {uploading ? 'Đang xử lý ảnh...' : 'Chọn file từ thiết bị (Ảnh / GIF)'}
          </button>
          <input
            ref={fileInputRef}
            id="fe-device-file-input"
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) processUploadFiles(files);
            }}
          />
          <p className="text-[10px] text-gray-400 mt-2 m-0">
            hoặc <strong>kéo & thả file ảnh từ máy</strong> trực tiếp vào ô này
          </p>
        </div>
      </section>

      {/* 3. THƯ VIỆN QUẢN LÝ ẢNH ĐÃ TẢI LÊN */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <h4 className="text-[11px] font-bold uppercase text-gray-700 m-0">
              Ảnh tải lên của bạn ({customUploads.length})
            </h4>
          </div>
          {customUploads.length > 0 && (
            <button
              onClick={() => {
                Modal.confirm({
                  title: 'Xóa tất cả ảnh đã tải lên?',
                  content: 'Hành động này sẽ xóa toàn bộ ảnh trong kho cá nhân của bạn.',
                  okText: 'Xóa tất cả',
                  cancelText: 'Hủy',
                  okButtonProps: { danger: true },
                  onOk: clearAllCustomUploads,
                });
              }}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Dọn dẹp kho
            </button>
          )}
        </div>

        {/* Ô tìm kiếm ảnh */}
        {customUploads.length > 3 && (
          <Input
            size="small"
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm theo tên ảnh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="text-xs rounded-lg"
          />
        )}

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-bold text-gray-500 no-scrollbar">
          {[
            ['all', 'Tất cả'],
            ['character', '👤 Idol'],
            ['label', '🏷️ Nhãn dán'],
            ['logo', '🛡️ Logo'],
            ['sticker', '🌸 Sticker'],
            ['gif', '🎬 GIF'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilterCat(id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                filterCat === id ? 'bg-[#d81e69] text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid danh sách ảnh tải lên */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredUploads.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/photobooth-asset',
                  JSON.stringify({
                    src: item.src,
                    width: item.width,
                    height: item.height,
                    name: item.name,
                    category: item.category,
                  })
                );
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title="Nhấp giữ chuột để KÉO vào ô ảnh hoặc canvas!"
              className="group relative p-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#d81e69] hover:bg-pink-50/40 flex flex-col items-center text-center transition-all shadow-xs cursor-grab active:cursor-grabbing"
            >
              {/* Thanh thao tác quản lý nhanh góc trên */}
              <div className="absolute top-1 left-1 right-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  title="Xóa khỏi kho"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomUpload(item.id);
                  }}
                  className="w-5 h-5 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-gray-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer transition-colors"
                >
                  <DeleteOutlined />
                </button>

                <div className="flex gap-1">
                  <button
                    title="✂️ Tách phông nền ảnh này"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBgModal(item);
                    }}
                    className="w-5 h-5 rounded-full bg-white/90 hover:bg-[#d81e69] hover:text-white text-gray-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer transition-colors"
                  >
                    <ScissorOutlined />
                  </button>
                  <button
                    title="Đổi tên / phân loại"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem({ id: item.id, name: item.name, category: item.category });
                    }}
                    className="w-5 h-5 rounded-full bg-white/90 hover:bg-[#d81e69] hover:text-white text-gray-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer transition-colors"
                  >
                    <EditOutlined />
                  </button>
                  <button
                    title="Xem ảnh lớn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewItem({ src: item.src, name: item.name });
                    }}
                    className="w-5 h-5 rounded-full bg-white/90 hover:bg-[#d81e69] hover:text-white text-gray-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer transition-colors"
                  >
                    <EyeOutlined />
                  </button>
                </div>
              </div>

              {item.isGif && (
                <span className="absolute top-1 right-1 text-[8px] font-black uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded shadow-xs z-10">
                  GIF
                </span>
              )}

              <div className="w-16 h-16 flex items-center justify-center p-1 mb-1 pointer-events-none">
                <img
                  src={item.src}
                  alt={item.name}
                  className="max-w-full max-h-full object-contain filter drop-shadow-xs"
                />
              </div>

              <span className="text-[10px] font-semibold text-gray-700 truncate w-full group-hover:text-[#d81e69]">
                {item.name}
              </span>

              <span className="text-[8px] text-gray-400 mt-0.5">
                {item.category === 'character'
                  ? '👤 Idol'
                  : item.category === 'label'
                  ? '🏷️ Nhãn'
                  : item.category === 'logo'
                  ? '🛡️ Logo'
                  : item.category === 'sticker'
                  ? '🌸 Sticker'
                  : 'Hình ảnh'}
              </span>

              {/* 2 nút thao tác tiện dụng */}
              <div className="mt-2 w-full flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() =>
                    openAttachModal({
                      src: item.src,
                      name: item.name,
                      width: item.width,
                      height: item.height,
                      defaultPos: 'right',
                    })
                  }
                  className="w-full py-1 text-[9px] font-bold text-white bg-[#d81e69] hover:bg-[#c01a5d] rounded transition-colors shadow-xs cursor-pointer"
                >
                  👤 Ghép vào Ô ảnh...
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addImage(item.src, item.width, item.height, undefined, undefined, item.name);
                    message.success(`Đã thêm "${item.name}" vào frame!`);
                  }}
                  className="w-full py-0.5 text-[8.5px] font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded transition-colors cursor-pointer"
                >
                  + Thêm Sticker
                </button>
              </div>
            </div>
          ))}

          {filteredUploads.length === 0 && (
            <div className="col-span-2 text-center py-8 text-xs text-gray-400">
              {searchQuery ? 'Không tìm thấy ảnh phù hợp với từ khóa.' : 'Chưa có ảnh tải lên nào trong danh mục này.'}
            </div>
          )}
        </div>
      </section>

      {/* MODAL ĐỔI TÊN & PHÂN LOẠI ẢNH */}
      <Modal
        open={!!editingItem}
        onCancel={() => setEditingItem(null)}
        onOk={() => {
          if (!editingItem) return;
          updateCustomUpload(editingItem.id, {
            name: editingItem.name.trim() || 'Hình ảnh',
            category: editingItem.category,
          });
          message.success('Đã cập nhật thông tin ảnh!');
          setEditingItem(null);
        }}
        title="✏️ Đổi tên & Phân loại hình ảnh"
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        {editingItem && (
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tên hình ảnh:</label>
              <Input
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Nhập tên hình ảnh..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Loại danh mục:</label>
              <Select
                value={editingItem.category}
                onChange={(cat) => setEditingItem({ ...editingItem, category: cat })}
                className="w-full"
                options={[
                  { value: 'character', label: '👤 Nhân vật / Idol (Ghép vào Ô ảnh)' },
                  { value: 'label', label: '🏷️ Nhãn dán / Badge' },
                  { value: 'logo', label: '🛡️ Logo / Watermark' },
                  { value: 'sticker', label: '🌸 Sticker trang trí' },
                  { value: 'other', label: '🎨 Khác' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL XEM ẢNH LỚN (PREVIEW) */}
      <Modal
        open={!!previewItem}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        title={previewItem?.name || 'Xem ảnh'}
        centered
      >
        {previewItem && (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl">
            <img src={previewItem.src} alt={previewItem.name} className="max-h-[60vh] max-w-full object-contain filter drop-shadow-md" />
          </div>
        )}
      </Modal>

      {/* MODAL TÁCH PHÔNG NỀN (BACKGROUND REMOVER STUDIO) */}
      <Modal
        open={!!bgModalItem}
        onCancel={() => setBgModalItem(null)}
        width={560}
        centered
        title={
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <ScissorOutlined className="text-[#d81e69]" /> Tách phông nền trong suốt: {bgModalItem?.name}
          </div>
        }
        footer={[
          <button
            key="cancel"
            onClick={() => setBgModalItem(null)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-semibold mr-2 cursor-pointer"
          >
            Đóng
          </button>,
          <button
            key="apply-update"
            disabled={!bgModalPreview || bgModalLoading}
            onClick={() => {
              if (!bgModalItem || !bgModalPreview) return;
              updateCustomUpload(bgModalItem.id, { src: bgModalPreview });
              message.success('Đã cập nhật ảnh tách nền thành công!');
              setBgModalItem(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold mr-2 cursor-pointer disabled:opacity-40"
          >
            Ghi đè ảnh này
          </button>,
          <button
            key="save-new"
            disabled={!bgModalPreview || bgModalLoading}
            onClick={async () => {
              if (!bgModalItem || !bgModalPreview) return;
              message.loading({ content: 'Đang lưu ảnh tách nền vào Database Photo...', key: 'save-cutout-modal', duration: 0 });
              try {
                const blob = await fetch(bgModalPreview).then((r) => r.blob());
                let savedPhoto: any = null;
                try {
                  savedPhoto = await adminApi.uploadFrameAsset({
                    file: blob,
                    name: `${bgModalItem.name} (Tách nền)`,
                    category: 'character',
                    metadata: { is_cutout: true },
                  });
                } catch (e) {
                  console.warn('Lưu photo entity lỗi, fallback', e);
                }

                const finalUrl = savedPhoto?.processed_file_url || savedPhoto?.original_file_url || bgModalPreview;
                addCustomUpload({
                  id: savedPhoto?.id,
                  name: `${bgModalItem.name} (Tách nền)`,
                  src: finalUrl,
                  category: 'character',
                  width: bgModalItem.width,
                  height: bgModalItem.height,
                  isGif: false,
                });
                message.success({ content: 'Đã lưu ảnh đã tách nền vào Database Photo & Thư Viện!', key: 'save-cutout-modal', duration: 3 });
                setBgModalItem(null);
              } catch (err) {
                console.error(err);
                message.error({ content: 'Không thể lưu ảnh tách nền', key: 'save-cutout-modal', duration: 3 });
              }
            }}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d81e69] to-[#7928ca] text-white text-xs font-bold shadow hover:opacity-95 cursor-pointer disabled:opacity-40"
          >
            ✨ Lưu thành ảnh mới
          </button>,
        ]}
      >
        {bgModalItem && (
          <div className="space-y-4 py-2">
            {/* So sánh Trước & Sau */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-gray-500 block mb-2">Ảnh Gốc</span>
                <div className="h-48 flex items-center justify-center overflow-hidden bg-white rounded-lg border border-gray-100 p-1">
                  <img src={bgModalItem.src} alt="Gốc" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-[#d81e69] block mb-2">
                  Kết Quả Tách Nền Trong Suốt
                </span>
                <div
                  className="h-48 flex items-center justify-center overflow-hidden rounded-lg border border-pink-200 p-1 relative"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#fff',
                  }}
                >
                  {bgModalLoading ? (
                    <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
                      <LoadingOutlined className="text-2xl text-[#d81e69]" />
                      <span>Đang xử lý tách nền...</span>
                    </div>
                  ) : bgModalPreview ? (
                    <img src={bgModalPreview} alt="Tách nền" className="max-h-full max-w-full object-contain filter drop-shadow-sm" />
                  ) : (
                    <span className="text-xs text-gray-400">Chưa có kết quả</span>
                  )}
                </div>
              </div>
            </div>

            {/* Điều khiển tách nền */}
            <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Phương pháp tách:</span>
                <Radio.Group
                  size="small"
                  value={bgModalMethod}
                  onChange={(e) => {
                    const m = e.target.value;
                    setBgModalMethod(m);
                    if (bgModalItem) generateCutoutPreview(bgModalItem.src, m, bgModalTolerance);
                  }}
                  buttonStyle="solid"
                >
                  <Radio.Button value="smart-solid">⚡ Siêu tốc (Nền trắng/đơn sắc)</Radio.Button>
                  <Radio.Button value="ai">🤖 AI Model (Mọi ảnh)</Radio.Button>
                </Radio.Group>
              </div>

              {bgModalMethod === 'smart-solid' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-gray-600">
                    <span>Độ nhạy khử màu (Tolerance):</span>
                    <span className="font-mono font-bold text-[#d81e69]">{bgModalTolerance}</span>
                  </div>
                  <Slider
                    min={15}
                    max={80}
                    value={bgModalTolerance}
                    onChange={(val) => {
                      setBgModalTolerance(val);
                      if (bgModalItem) generateCutoutPreview(bgModalItem.src, 'smart-solid', val);
                    }}
                  />
                  <p className="text-[10px] text-gray-400 m-0">
                    Kéo tăng độ nhạy nếu còn dính viền trắng xung quanh tóc/vai.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL GHÉP ẢNH / IDOL VÀO Ô SLOT */}
      <Modal
        open={!!attachModalItem}
        onCancel={() => setAttachModalItem(null)}
        onOk={handleConfirmAttach}
        okText="✨ Xác nhận Ghép vào Ô ảnh"
        cancelText="Hủy"
        title="👤 Ghép Hình Ảnh / Idol vào Ô ảnh"
        okButtonProps={{ style: { backgroundColor: '#d81e69' } }}
      >
        {attachModalItem && (
          <div className="space-y-4 py-2">
            <div className="flex gap-4 items-center bg-pink-50/50 p-3 rounded-xl border border-pink-100">
              <div className="w-16 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                <img
                  src={attachModalItem.src}
                  alt={attachModalItem.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-800 truncate">{attachModalItem.name}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Hình ảnh sẽ được căn chỉnh vừa khít chiều cao ô ảnh, cắt phẳng chân và chừa không gian để khách đứng chụp cùng.
                </p>
              </div>
            </div>

            {slots.length === 0 ? (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs">
                Canvas hiện tại chưa có ô ảnh (Slot) nào. Vui lòng quay lại tab "Thêm" hoặc "Mẫu Frame" để thêm ít nhất 1 ô ảnh!
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    1. Chọn Ô ảnh muốn ghép vào:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTargetSlotId(s.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          targetSlotId === s.id
                            ? 'border-[#d81e69] bg-pink-50/60 font-bold text-[#d81e69] shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-xs">Ô ảnh #{idx + 1}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {Math.round(s.width)} × {Math.round(s.height)}px
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    2. Vị trí đứng của nhân vật trong ô:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetPos('left')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        targetPos === 'left'
                          ? 'border-[#d81e69] bg-pink-50 text-[#d81e69] shadow-xs'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      👈 Đứng Bên Trái (Khách đứng phải)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPos('right')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        targetPos === 'right'
                          ? 'border-[#d81e69] bg-pink-50 text-[#d81e69] shadow-xs'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      👉 Đứng Bên Phải (Khách đứng trái)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Lật mặt hướng sang phía ngược lại (Flip):</span>
                  <Switch checked={targetFlip} onChange={setTargetFlip} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==========================================
// TAB 3: THÀNH PHẦN & STICKER CANVA GALLERY
// ==========================================
const ElementsGalleryTab: React.FC = () => {
  const addImage = useEditorStore((s) => s.addImage);
  const [category, setCategory] = useState<AssetCategory>('all');
  const [search, setSearch] = useState('');

  const handleSelectPreset = (item: PresetAsset) => {
    const img = new window.Image();
    img.onload = () => {
      addImage(item.src, item.defaultWidth || img.naturalWidth || 200, item.defaultHeight || img.naturalHeight || 200);
      message.success(`Đã thêm ${item.name}!`);
    };
    img.src = item.src;
  };

  const filteredPresets = PRESET_CHARACTERS_AND_STICKERS.filter((p) => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const CATEGORIES: { id: AssetCategory; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'label', label: '🏷️ Nhãn & Washi Tape' },
    { id: 'vietnam', label: '🇻🇳 Việt Nam & 1944' },
    { id: 'y2k', label: '✨ Y2K Cyber' },
    { id: 'celebrity', label: '🌟 Idol K-Pop' },
    { id: 'character', label: '🐰 Mascot Cute' },
    { id: 'vintage', label: '🎞️ Vintage Film' },
    { id: 'cute', label: '🌸 Doodles & Nơ' },
    { id: 'birthday', label: '🎂 Sinh nhật' },
    { id: 'icon', label: '⭐ Biểu tượng' },
    { id: 'gif', label: '🎬 GIF Động' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Tìm nhãn dán, cờ, ngôi sao, nơ, washi tape, gif..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="middle"
          className="rounded-xl shadow-xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold text-gray-500 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors shrink-0 ${
              category === c.id ? 'bg-[#d81e69] text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid items */}
      <div className="grid grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredPresets.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelectPreset(item)}
            className="group relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#d81e69] hover:bg-pink-50/40 flex flex-col items-center text-center transition-all shadow-sm hover:scale-[1.02]"
          >
            {item.isGif && (
              <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                GIF
              </span>
            )}
            <div className="w-16 h-16 flex items-center justify-center p-1 mb-1">
              <img src={item.src} alt={item.name} className="max-w-full max-h-full object-contain filter drop-shadow-sm" />
            </div>
            <span className="text-[10px] font-semibold text-gray-700 truncate w-full group-hover:text-[#d81e69]">
              {item.name}
            </span>
          </button>
        ))}
        {filteredPresets.length === 0 && (
          <div className="col-span-2 text-center py-8 text-xs text-gray-400">
            Không tìm thấy thành phần nào.
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// TAB 4: THÊM CƠ BẢN (Slots, Chữ, Hình Khối)
// ==========================================
const ElementsTab: React.FC = () => {
  const addSlot = useEditorStore((s) => s.addSlot);
  const addShape = useEditorStore((s) => s.addShape);
  const addText = useEditorStore((s) => s.addText);

  return (
    <div className="p-4 space-y-6">
      <section>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[11px] font-bold uppercase text-gray-400">Ô ảnh khách chụp (Slots)</h4>
          <span className="text-[10px] font-bold text-[#08979c] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
            Khung chụp
          </span>
        </div>
        <button
          id="fe-add-slot"
          onClick={addSlot}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 border-dashed border-[#08979c] bg-[#08979c]/5 text-[#067a7e] font-bold hover:bg-[#08979c]/10 transition-colors shadow-sm"
        >
          <BlockOutlined className="text-lg" /> Thêm ô ảnh (Slot)
        </button>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          Mỗi ô slot sẽ được đục lỗ trong suốt trên frame kèm viền & bo góc (chỉnh ở bảng thuộc tính bên phải).
        </p>
      </section>

      <section>
        <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-2">Văn bản trang trí</h4>
        <button
          id="fe-add-text"
          onClick={addText}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
        >
          <FontSizeOutlined className="text-[#d81e69]" /> Thêm chữ / Tiêu đề
        </button>
      </section>

      <section>
        <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-2">Hình khối</h4>
        <div className="grid grid-cols-5 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.kind}
              id={`fe-shape-${s.kind}`}
              onClick={() => addShape(s.kind)}
              title={s.label}
              className="h-11 rounded-lg bg-gray-100 hover:bg-pink-50 hover:text-[#d81e69] text-gray-600 flex items-center justify-center transition-colors"
            >
              {s.icon}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const MiniLayoutPreview: React.FC<{ preset: BaseFrameLayout; active?: boolean }> = ({ preset, active }) => {
  const maxW = 44;
  const maxH = 54;
  const scale = Math.min(maxW / preset.width, maxH / preset.height);
  const w = Math.max(16, Math.round(preset.width * scale));
  const h = Math.max(16, Math.round(preset.height * scale));

  return (
    <div style={{ width: maxW, height: maxH }} className="flex items-center justify-center shrink-0">
      <div
        style={{ width: w, height: h }}
        className={`relative rounded-[3px] border transition-colors overflow-hidden ${
          active ? 'bg-pink-100/70 border-[#d81e69]' : 'bg-gray-100 border-gray-300'
        }`}
      >
        {preset.slots.map((s, i) => (
          <div
            key={i}
            style={{
              left: `${(s.x / preset.width) * 100}%`,
              top: `${(s.y / preset.height) * 100}%`,
              width: `${(s.width / preset.width) * 100}%`,
              height: `${(s.height / preset.height) * 100}%`,
            }}
            className={`absolute rounded-[1px] border ${
              active ? 'bg-[#d81e69] border-[#b01452] opacity-90' : 'bg-gray-400 border-gray-500 opacity-70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// TAB 5: CANVAS & ẢNH NỀN (Background Image)
// ==========================================
const CanvasTab: React.FC = () => {
  const canvas = useEditorStore((s) => s.doc.canvas);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const setBackground = useEditorStore((s) => s.setBackground);
  const applyBaseFrameLayout = useEditorStore((s) => s.applyBaseFrameLayout);
  const currentLayoutId = useEditorStore((s) => s.currentLayoutId);
  const bg = canvas.background;

  const [layoutFilter, setLayoutFilter] = useState<'all' | 'strip' | 'grid' | 'group'>('all');

  const bgFileRef = useRef<HTMLInputElement>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  const filteredPresets =
    layoutFilter === 'all' ? BASE_FRAME_PRESETS : BASE_FRAME_PRESETS.filter((p) => p.category === layoutFilter);

  const numberInput = (value: number, onChange: (v: number) => void, id: string) => (
    <input
      id={id}
      type="number"
      min={100}
      max={6000}
      value={value}
      onChange={(e) => onChange(Math.min(6000, Math.max(0, parseInt(e.target.value, 10) || 0)))}
      onBlur={(e) => onChange(Math.max(100, parseInt(e.target.value, 10) || 100))}
      className="w-full bg-gray-100 rounded-md px-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-[#d81e69] outline-none"
    />
  );

  const setBgType = (type: CanvasBackground['type']) => {
    if (type === 'solid') setBackground({ type: 'solid', color: '#ffffff' });
    else if (type === 'gradient') setBackground({ type: 'gradient', from: '#ffd1e3', to: '#d81e69', angle: 180 });
    else if (type === 'image') {
      if (bg.type !== 'image') {
        setBackground({ type: 'image', src: PRESET_BACKGROUNDS[0].src, fit: 'cover', opacity: 1 });
      }
    } else {
      setBackground({ type: 'transparent' });
    }
  };

  const handleUploadBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file hình ảnh');
      return;
    }

    try {
      setUploadingBg(true);
      message.loading({ content: 'Đang tải ảnh nền lên...', key: 'bg-upload', duration: 0 });

      const reader = new FileReader();
      const localUrl = await new Promise<string>((res) => {
        reader.onload = () => res(String(reader.result));
        reader.readAsDataURL(file);
      });

      adminApi.uploadAsset(file, 'backgrounds').catch(() => {});

      setBackground({
        type: 'image',
        src: localUrl,
        fit: 'cover',
        opacity: 1,
      });

      message.success({ content: 'Đã cập nhật ảnh nền frame!', key: 'bg-upload', duration: 3 });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Không tải được ảnh nền.', key: 'bg-upload', duration: 3 });
    } finally {
      setUploadingBg(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* CHỌN BỐ CỤC CHUẨN TỪ BASE_FRAMES */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-[11px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
            <LayoutOutlined className="text-[#d81e69]" /> KÍCH THƯỚC & BỐ CỤC (PRESET)
          </h4>
          <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
            Default x, y chuẩn
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3 leading-tight">
          Chọn dạng aspect ratio đã định danh: tự động đặt kích thước và sinh các ô ảnh đúng vị trí mặc định.
        </p>

        {/* Bộ lọc loại layout */}
        <div className="flex gap-1 mb-2.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'strip', label: 'Strip dọc' },
            { id: 'grid', label: 'Lưới ảnh' },
            { id: 'group', label: 'Nhóm 5-7P' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setLayoutFilter(cat.id as any)}
              className={`flex-1 py-1 rounded-md text-[11px] transition-colors ${
                layoutFilter === cat.id ? 'bg-white shadow text-[#d81e69] font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Danh sách các Layout Base Frame */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredPresets.map((p) => {
            const active =
              (canvas.width === p.width && canvas.height === p.height) || currentLayoutId === p.id;
            return (
              <div
                key={p.id}
                id={`layout-preset-${p.id}`}
                onClick={() => {
                  applyBaseFrameLayout(p.id);
                  requestFitZoom();
                  message.success(`Đã áp dụng bố cục ${p.name} với ${p.slotCount} ô ảnh mặc định!`);
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                  active
                    ? 'border-[#d81e69] bg-pink-50/70 shadow-xs ring-1 ring-[#d81e69]'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-gray-50'
                }`}
              >
                <MiniLayoutPreview preset={p} active={active} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${active ? 'text-[#d81e69]' : 'text-gray-800'}`}>
                      {p.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 font-semibold shrink-0">
                      {p.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">{p.description}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                    <span className="font-semibold text-gray-600">{p.width}×{p.height}px</span>
                    <span>•</span>
                    <span className="text-teal-600 font-semibold">{p.slotCount} ô ảnh</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      <section>
        <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-2">Tùy chỉnh (px)</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[10px] text-gray-500 uppercase font-bold">
            Rộng
            {numberInput(canvas.width, (w) => setCanvasSize(w, canvas.height), 'canvas-w')}
          </label>
          <label className="text-[10px] text-gray-500 uppercase font-bold">
            Cao
            {numberInput(canvas.height, (h) => setCanvasSize(canvas.width, h), 'canvas-h')}
          </label>
        </div>
      </section>

      <section>
        <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1.5">
          <PictureOutlined className="text-[#d81e69]" /> Nền Frame (Background)
        </h4>

        {/* Chuyển loại nền */}
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs mb-3 font-semibold">
          {(
            [
              ['image', 'Ảnh nền'],
              ['solid', 'Màu'],
              ['gradient', 'Gradient'],
              ['transparent', 'Trong suốt'],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setBgType(t)}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                bg.type === t ? 'bg-white shadow text-[#d81e69] font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* NỀN ẢNH */}
        {bg.type === 'image' && (
          <div className="space-y-3.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <button
              id="fe-upload-bg-btn"
              disabled={uploadingBg}
              onClick={() => bgFileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-[#d81e69] bg-white text-[#d81e69] text-xs font-bold hover:bg-pink-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {uploadingBg ? <LoadingOutlined /> : <UploadOutlined />}
              {uploadingBg ? 'Đang tải ảnh...' : 'Tải ảnh nền mới từ máy'}
            </button>
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadBgImage} />

            {/* Fit mode */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Chế độ vừa khung:</span>
              <div className="flex gap-1">
                {(['cover', 'stretch', 'contain'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBackground({ ...bg, fit: mode })}
                    className={`px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                      (bg.fit || 'cover') === mode
                        ? 'bg-[#d81e69] text-white shadow-xs'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Độ mờ nền:</span>
                <span className="font-mono text-[11px] text-[#d81e69]">{Math.round((bg.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={bg.opacity ?? 1}
                onChange={(e) => setBackground({ ...bg, opacity: parseFloat(e.target.value) })}
                className="w-full accent-[#d81e69]"
              />
            </div>

            {/* Presets Background */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Mẫu nền có sẵn (Presets)</div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_BACKGROUNDS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBackground({ type: 'image', src: item.src, fit: 'cover', opacity: bg.opacity ?? 1 })}
                    className={`group relative h-14 rounded-lg overflow-hidden border transition-all ${
                      bg.src === item.src ? 'border-[#d81e69] ring-2 ring-[#d81e69]/30' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-full" style={{ backgroundColor: item.preview }} />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate text-left">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NỀN MÀU ĐƠN */}
        {bg.type === 'solid' && (
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span>Màu nền:</span>
            <input
              type="color"
              value={bg.color}
              onChange={(e) => setBackground({ type: 'solid', color: e.target.value })}
              className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
            />
          </div>
        )}

        {/* NỀN GRADIENT */}
        {bg.type === 'gradient' && (
          <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
            <div className="flex items-center justify-between">
              <span>Màu bắt đầu:</span>
              <input
                type="color"
                value={bg.from}
                onChange={(e) => setBackground({ ...bg, from: e.target.value })}
                className="w-9 h-7 rounded border border-gray-200 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Màu kết thúc:</span>
              <input
                type="color"
                value={bg.to}
                onChange={(e) => setBackground({ ...bg, to: e.target.value })}
                className="w-9 h-7 rounded border border-gray-200 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Góc:</span>
                <span className="font-mono text-gray-500">{bg.angle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={bg.angle}
                onChange={(e) => setBackground({ ...bg, angle: parseInt(e.target.value, 10) })}
                className="w-full accent-[#d81e69]"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

// ==========================================
// TAB 6: LỚP (LAYERS)
// ==========================================
const LayersTab: React.FC = () => {
  const objects = useEditorStore((s) => s.doc.objects);
  const selection = useEditorStore((s) => s.selection);
  const setSelection = useEditorStore((s) => s.setSelection);
  const updateObjects = useEditorStore((s) => s.updateObjects);
  const removeObjects = useEditorStore((s) => s.removeObjects);

  const reversed = [...objects].reverse();

  if (!objects.length) {
    return <div className="p-8 text-center text-xs text-gray-400">Chưa có đối tượng nào trên canvas.</div>;
  }

  return (
    <div className="p-2 space-y-1">
      {reversed.map((o) => {
        const active = selection.includes(o.id);
        const name = o.name || `${OBJECT_LABEL[o.type]} #${o.id.slice(-4)}`;
        return (
          <div
            key={o.id}
            onClick={() => setSelection([o.id])}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors group ${
              active ? 'bg-pink-50 text-[#d81e69] font-bold' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 w-12 shrink-0">{OBJECT_LABEL[o.type]}</span>
            <span className="flex-1 truncate">{name}</span>
            <button
              title={o.visible === false ? 'Hiện' : 'Ẩn'}
              onClick={(e) => {
                e.stopPropagation();
                updateObjects([o.id], { visible: o.visible === false });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {o.visible === false ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
            <button
              title={o.locked ? 'Mở khóa' : 'Khóa'}
              onClick={(e) => {
                e.stopPropagation();
                updateObjects([o.id], { locked: !o.locked });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {o.locked ? <LockOutlined className="text-amber-500" /> : <UnlockOutlined />}
            </button>
            <button
              title="Xoá"
              onClick={(e) => {
                e.stopPropagation();
                removeObjects([o.id]);
              }}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <DeleteOutlined />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'templates', label: 'Mẫu Frame', icon: <LayoutOutlined /> },
  { id: 'uploads', label: 'Tải lên', icon: <CloudUploadOutlined /> },
  { id: 'stickers', label: 'Thành phần', icon: <SmileOutlined /> },
  { id: 'elements', label: 'Thêm', icon: <AppstoreAddOutlined /> },
  { id: 'canvas', label: 'Nền', icon: <BgColorsOutlined /> },
  { id: 'layers', label: 'Lớp', icon: <BlockOutlined /> },
];

const ToolSidebar: React.FC = () => {
  const [tab, setTab] = useState<Tab>('templates');

  return (
    <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`fe-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[9.5px] font-bold transition-colors border-b-2 ${
              tab === t.id ? 'text-[#d81e69] border-[#d81e69]' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <span className="text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'templates' && <TemplatesTab />}
        {tab === 'uploads' && <UploadsTab />}
        {tab === 'stickers' && <ElementsGalleryTab />}
        {tab === 'elements' && <ElementsTab />}
        {tab === 'canvas' && <CanvasTab />}
        {tab === 'layers' && <LayersTab />}
      </div>
    </aside>
  );
};

export default ToolSidebar;
