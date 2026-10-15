import { create } from 'zustand';
import type {
  CanvasBackground,
  CustomUploadItem,
  EditorDoc,
  EditorObject,
  FrameTemplate,
  ImageObject,
  ShapeKind,
  ShapeObject,
  SlotObject,
  TextObject,
} from './types';

import { BASE_FRAME_PRESETS } from './presets';
import { adminApi } from '@/api/admin.api';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 700;
const TEMPLATES_KEY = 'pb_custom_templates';
const UPLOADS_KEY = 'pb_custom_uploads';

const loadSavedTemplates = (): FrameTemplate[] => {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadSavedUploads = (): CustomUploadItem[] => {
  try {
    const raw = localStorage.getItem(UPLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

let idCounter = 0;
export const newId = () => `obj_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

const defaultLayout = BASE_FRAME_PRESETS[0]; // 1x4 Photo Strip kinh điển

const initialDoc = (): EditorDoc => ({
  canvas: { width: defaultLayout.width, height: defaultLayout.height, background: { type: 'solid', color: '#ffffff' } },
  objects: defaultLayout.slots.map((s, idx) => ({
    id: `slot_init_${idx + 1}`,
    type: 'slot',
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    rotation: 0,
    opacity: 1,
    name: `Ô ảnh #${idx + 1}`,
    cornerRadius: 0,
    stroke: '',
    strokeWidth: 0,
  })),
});

type ReorderMode = 'front' | 'back' | 'forward' | 'backward';

interface EditorState {
  doc: EditorDoc;
  past: EditorDoc[];
  future: EditorDoc[];
  selection: string[];
  zoom: number;
  /** true khi đang xuất file: ẩn placeholder, đục lỗ tại slot */
  exporting: boolean;
  frameName: string;
  lastCoalesce: { key: string; at: number } | null;

  currentLayoutId: string;
  currentAspectRatio: string;

  customTemplates: FrameTemplate[];
  customUploads: CustomUploadItem[];
  customerPreview: boolean;

  setZoom: (zoom: number) => void;
  setExporting: (v: boolean) => void;
  setFrameName: (name: string) => void;
  setCustomerPreview: (v: boolean) => void;

  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string) => void;

  setCanvasSize: (width: number, height: number) => void;
  setBackground: (bg: CanvasBackground) => void;
  applyBaseFrameLayout: (layoutId: string, keepDecorations?: boolean) => void;

  attachIdolToSlot: (
    slotId: string,
    src: string,
    position?: 'left' | 'right' | 'center',
    nw?: number,
    nh?: number,
    flipX?: boolean
  ) => void;
  removeIdolFromSlot: (slotId: string) => void;
  applyPhotoStarPreset: () => void;



  addSlot: () => void;
  addShape: (shape: ShapeKind) => void;
  addText: () => void;
  addImage: (
    src: string,
    naturalWidth: number,
    naturalHeight: number,
    initialX?: number,
    initialY?: number,
    name?: string
  ) => void;

  updateObjects: (ids: string[], patch: Partial<EditorObject>, coalesceKey?: string) => void;
  /** Cập nhật nhiều object với patch khác nhau trong cùng một bước undo */
  updateMany: (patches: Record<string, Partial<EditorObject>>) => void;
  moveBy: (ids: string[], dx: number, dy: number) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  reorder: (ids: string[], mode: ReorderMode) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadTemplate: (templateDoc: EditorDoc, templateName?: string) => void;

  saveCustomTemplate: (name: string, description?: string, preview?: string) => void;
  deleteCustomTemplate: (id: string) => void;
  loadFrameAssetsFromDb: () => Promise<void>;
  addCustomUpload: (item: Omit<CustomUploadItem, 'id' | 'createdAt'> & { id?: string }) => void;
  updateCustomUpload: (id: string, patch: Partial<CustomUploadItem>) => void;
  deleteCustomUpload: (id: string) => void;
  clearAllCustomUploads: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  /** Ghi một snapshot vào history rồi áp dụng doc mới. */
  const commit = (next: EditorDoc, coalesceKey?: string) => {
    const { doc, past, lastCoalesce } = get();
    const now = Date.now();
    const shouldCoalesce =
      !!coalesceKey && !!lastCoalesce && lastCoalesce.key === coalesceKey && now - lastCoalesce.at < COALESCE_MS;
    set({
      doc: next,
      past: shouldCoalesce ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      lastCoalesce: coalesceKey ? { key: coalesceKey, at: now } : null,
    });
  };

  const addObject = (obj: EditorObject) => {
    const { doc } = get();
    commit({ ...doc, objects: [...doc.objects, obj] });
    set({ selection: [obj.id] });
  };

  return {
    doc: initialDoc(),
    past: [],
    future: [],
    selection: [],
    zoom: 0.4,
    exporting: false,
    frameName: '',
    lastCoalesce: null,

    customTemplates: loadSavedTemplates(),
    customUploads: loadSavedUploads(),
    customerPreview: false,

    currentLayoutId: '1x4',
    currentAspectRatio: '1x4',

    setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.05, zoom)) }),
    setExporting: (exporting) => set({ exporting }),
    setFrameName: (frameName) => set({ frameName }),
    setCustomerPreview: (customerPreview) => set({ customerPreview }),

    setSelection: (selection) => set({ selection }),
    toggleSelection: (id) => {
      const { selection } = get();
      set({ selection: selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id] });
    },


    setCanvasSize: (width, height) => {
      const { doc } = get();
      commit({ ...doc, canvas: { ...doc.canvas, width: Math.round(width), height: Math.round(height) } }, 'canvas-size');
    },
    setBackground: (background) => {
      const { doc } = get();
      commit({ ...doc, canvas: { ...doc.canvas, background } }, 'canvas-bg');
    },

    applyBaseFrameLayout: (layoutId: string, keepDecorations = true) => {
      const preset = BASE_FRAME_PRESETS.find((p) => p.id === layoutId) || BASE_FRAME_PRESETS[0];
      const { doc } = get();

      // Giữ lại các vật thể trang trí (sticker, chữ, hình trang trí)
      const decorations = keepDecorations ? doc.objects.filter((o) => o.type !== 'slot') : [];

      // Sinh sẵn các ô ảnh (slots) với x, y, width, height mặc định chuẩn xác từ base_frames.json
      const newSlots: SlotObject[] = preset.slots.map((s, idx) => ({
        id: `slot_${Date.now()}_${idx + 1}`,
        type: 'slot',
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        rotation: 0,
        opacity: 1,
        name: `Ô ảnh #${idx + 1}`,
        cornerRadius: 0,
        stroke: '',
        strokeWidth: 0,
      }));

      // Thứ tự: Slot nằm dưới, stickers/text nằm trên
      const nextObjects: EditorObject[] = [...newSlots, ...decorations];

      commit(
        {
          ...doc,
          canvas: {
            ...doc.canvas,
            width: preset.width,
            height: preset.height,
          },
          objects: nextObjects,
        },
        'apply-base-layout'
      );

      set({
        currentLayoutId: preset.id,
        currentAspectRatio: preset.aspectRatio,
        selection: [],
      });
    },

    attachIdolToSlot: (slotId, src, position = 'right', nw = 300, nh = 400, flipX) => {
      const { doc } = get();
      const slot = doc.objects.find((o) => o.id === slotId && o.type === 'slot') as SlotObject | undefined;
      if (!slot) return;

      // Xoá idol cũ đã gắn với slot này (nếu có) để thay thế
      const filtered = doc.objects.filter((o) => !(o.type === 'image' && (o as ImageObject).slotId === slot.id));

      // Tính toán kích thước vừa vặn trong ô slot
      const targetHeight = slot.height;
      const ratio = Math.max(0.3, Math.min(1.5, (nw || 300) / (nh || 400)));
      let targetWidth = Math.round(targetHeight * ratio);

      // Giới hạn chiều rộng idol không vượt quá 60% ô slot để chừa không gian cho khách chụp
      const maxWidth = Math.round(slot.width * 0.6);
      if (targetWidth > maxWidth) targetWidth = maxWidth;
      if (targetWidth < Math.round(slot.width * 0.35)) targetWidth = Math.round(slot.width * 0.45);

      const targetY = slot.y;
      let targetX = slot.x;
      if (position === 'right') {
        targetX = slot.x + slot.width - targetWidth;
      } else if (position === 'center') {
        targetX = Math.round(slot.x + (slot.width - targetWidth) / 2);
      }

      const allSlots = doc.objects.filter((o) => o.type === 'slot');
      const slotIdx = allSlots.findIndex((s) => s.id === slot.id);

      const idolObj: ImageObject = {
        id: newId(),
        type: 'image',
        name: `Idol (Ô #${slotIdx >= 0 ? slotIdx + 1 : 1})`,
        src,
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        rotation: 0,
        opacity: 1,
        flipX: flipX !== undefined ? flipX : false,
        slotId: slot.id,
        clipToSlot: true,
        positionInSlot: position,
      };

      commit({ ...doc, objects: [...filtered, idolObj] }, 'attach-idol');
      set({ selection: [idolObj.id] });
    },

    removeIdolFromSlot: (slotId) => {
      const { doc } = get();
      const objects = doc.objects.filter((o) => !(o.type === 'image' && (o as ImageObject).slotId === slotId));
      commit({ ...doc, objects }, 'remove-idol');
    },

    applyPhotoStarPreset: () => {
      const { doc, attachIdolToSlot } = get();
      const slots = doc.objects.filter((o) => o.type === 'slot') as SlotObject[];
      if (!slots.length) return;
      const presets = [
        { src: '/idols/idol_1.png', pos: 'left' as const, w: 158, h: 143, flipX: false },
        { src: '/idols/idol_2.png', pos: 'right' as const, w: 159, h: 143, flipX: false },
        { src: '/idols/idol_3.png', pos: 'left' as const, w: 158, h: 143, flipX: false },
        { src: '/idols/idol_4.png', pos: 'right' as const, w: 159, h: 143, flipX: false },
      ];
      slots.forEach((s, idx) => {
        const p = presets[idx % presets.length];
        attachIdolToSlot(s.id, p.src, p.pos, p.w, p.h, p.flipX);
      });
    },



    loadTemplate: (templateDoc, templateName) => {
      commit(templateDoc);
      set({
        selection: [],
        ...(templateName ? { frameName: templateName } : {}),
      });
    },

    saveCustomTemplate: (name, description = '', preview = '') => {
      const { doc, customTemplates } = get();
      const newTpl: FrameTemplate = {
        id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim() || 'Mẫu của tôi',
        description: description.trim() || 'Mẫu tự thiết kế',
        category: 'custom',
        preview: preview || '#d81e69',
        doc: JSON.parse(JSON.stringify(doc)),
        isCustom: true,
        createdAt: Date.now(),
      };
      const next = [newTpl, ...customTemplates];
      try {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Lưu template thất bại:', e);
      }
      set({ customTemplates: next });
    },

    deleteCustomTemplate: (id) => {
      const next = get().customTemplates.filter((t) => t.id !== id);
      try {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next));
      } catch {}
      set({ customTemplates: next });
    },

    loadFrameAssetsFromDb: async () => {
      try {
        const photos = await adminApi.getFrameAssets();
        if (Array.isArray(photos)) {
          const dbItems: CustomUploadItem[] = photos.map((p) => ({
            id: p.id,
            name: p.title || 'Hình ảnh',
            src: p.processed_file_url || p.original_file_url,
            category: (p.asset_category as any) || 'character',
            width: p.width || 300,
            height: p.height || 300,
            createdAt: new Date(p.created_at).getTime(),
            isGif: (p.original_file_url || '').toLowerCase().endsWith('.gif'),
          }));

          const localItems = get().customUploads.filter(
            (loc) => !dbItems.some((db) => db.src === loc.src || db.id === loc.id)
          );
          const merged = [...dbItems, ...localItems];
          set({ customUploads: merged });
        }
      } catch (err) {
        console.warn('Lấy frame assets từ Photo entity thất bại:', err);
      }
    },

    addCustomUpload: (item) => {
      const newItem: CustomUploadItem = {
        ...item,
        id: item.id || `upl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      const fullList = [newItem, ...get().customUploads.filter((x) => x.src !== item.src && x.id !== newItem.id)].slice(0, 50);
      let storageList = fullList;
      while (storageList.length > 0) {
        try {
          localStorage.setItem(UPLOADS_KEY, JSON.stringify(storageList));
          break;
        } catch {
          if (storageList.length <= 1) {
            console.warn('Kho lưu trữ localStorage đã đầy, không thể lưu thêm vào bộ nhớ cache trình duyệt');
            break;
          }
          storageList = storageList.slice(0, storageList.length - 1);
        }
      }
      set({ customUploads: fullList });
    },

    deleteCustomUpload: (id) => {
      const next = get().customUploads.filter((u) => u.id !== id);
      try {
        localStorage.setItem(UPLOADS_KEY, JSON.stringify(next));
      } catch {}
      adminApi.deleteFrameAsset(id).catch(() => {});
      set({ customUploads: next });
    },

    updateCustomUpload: (id, patch) => {
      const next = get().customUploads.map((u) => (u.id === id ? { ...u, ...patch } : u));
      try {
        localStorage.setItem(UPLOADS_KEY, JSON.stringify(next));
      } catch {}
      adminApi.updateFrameAsset(id, { title: patch.name, asset_category: patch.category }).catch(() => {});
      set({ customUploads: next });
    },

    clearAllCustomUploads: () => {
      try {
        localStorage.removeItem(UPLOADS_KEY);
      } catch {}
      set({ customUploads: [] });
    },

    addSlot: () => {
      const { doc } = get();
      const { width: cw, height: ch } = doc.canvas;
      const width = Math.round(Math.min(cw * 0.7, ch * 0.5));
      const height = Math.round(width * 0.75);
      const slotCount = doc.objects.filter((o) => o.type === 'slot').length;
      const slot: SlotObject = {
        id: newId(),
        type: 'slot',
        x: Math.round((cw - width) / 2),
        y: Math.min(ch - height, Math.round(ch * 0.05 + slotCount * (height + ch * 0.02))),
        width,
        height,
        rotation: 0,
        opacity: 1,
        cornerRadius: 16,
        stroke: '#ffffff',
        strokeWidth: 4,
      };
      addObject(slot);
    },

    addShape: (shape) => {
      const { doc } = get();
      const size = Math.round(Math.min(doc.canvas.width, doc.canvas.height) * 0.25);
      const obj: ShapeObject = {
        id: newId(),
        type: 'shape',
        shape,
        x: Math.round((doc.canvas.width - size) / 2),
        y: Math.round((doc.canvas.height - size) / 2),
        width: size,
        height: size,
        rotation: 0,
        opacity: 1,
        fill: '#d81e69',
        stroke: '#000000',
        strokeWidth: 0,
        cornerRadius: 0,
        shadowColor: '#000000',
        shadowBlur: 0,
      };
      addObject(obj);
    },

    addText: () => {
      const { doc } = get();
      const width = Math.round(doc.canvas.width * 0.7);
      const obj: TextObject = {
        id: newId(),
        type: 'text',
        text: 'Nhập văn bản',
        x: Math.round((doc.canvas.width - width) / 2),
        y: Math.round(doc.canvas.height / 2),
        width,
        height: 0,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Arial',
        fontSize: Math.max(24, Math.round(doc.canvas.width * 0.08)),
        fontStyle: 'bold',
        fill: '#111111',
        align: 'center',
        stroke: '#ffffff',
        strokeWidth: 0,
        shadowColor: '#000000',
        shadowBlur: 0,
      };
      addObject(obj);
    },

    addImage: (src, nw, nh, initialX, initialY, name) => {
      const { doc } = get();
      const maxW = doc.canvas.width * 0.6;
      const maxH = doc.canvas.height * 0.6;
      const ratio = Math.min(maxW / (nw || 300), maxH / (nh || 300), 1);
      const width = Math.round((nw || 300) * ratio);
      const height = Math.round((nh || 300) * ratio);
      const obj: ImageObject = {
        id: newId(),
        type: 'image',
        name: name || 'Hình ảnh',
        src,
        x: initialX !== undefined ? initialX : Math.round((doc.canvas.width - width) / 2),
        y: initialY !== undefined ? initialY : Math.round((doc.canvas.height - height) / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
      };
      addObject(obj);
    },

    updateObjects: (ids, patch, coalesceKey) => {
      const { doc } = get();
      const objects = doc.objects.map((o) => {
        if (!ids.includes(o.id)) return o;
        const merged = { ...o, ...patch } as EditorObject;
        // Slot luôn là hình chữ nhật thẳng
        if (merged.type === 'slot') merged.rotation = 0;
        return merged;
      });
      commit({ ...doc, objects }, coalesceKey);
    },

    updateMany: (patches) => {
      const { doc } = get();
      const objects = doc.objects.map((o) => {
        const p = patches[o.id];
        if (!p) return o;
        const merged = { ...o, ...p } as EditorObject;
        if (merged.type === 'slot') merged.rotation = 0;
        return merged;
      });
      commit({ ...doc, objects });
    },

    moveBy: (ids, dx, dy) => {
      const { doc } = get();
      const objects = doc.objects.map((o) =>
        ids.includes(o.id) && !o.locked ? { ...o, x: o.x + dx, y: o.y + dy } : o,
      );
      commit({ ...doc, objects }, 'nudge');
    },

    removeObjects: (ids) => {
      const { doc, selection } = get();
      commit({ ...doc, objects: doc.objects.filter((o) => !ids.includes(o.id)) });
      set({ selection: selection.filter((s) => !ids.includes(s)) });
    },

    duplicateObjects: (ids) => {
      const { doc } = get();
      const offset = Math.round(Math.min(doc.canvas.width, doc.canvas.height) * 0.03);
      const clones = doc.objects
        .filter((o) => ids.includes(o.id))
        .map((o) => ({ ...o, id: newId(), x: o.x + offset, y: o.y + offset, locked: false }) as EditorObject);
      if (!clones.length) return;
      commit({ ...doc, objects: [...doc.objects, ...clones] });
      set({ selection: clones.map((c) => c.id) });
    },

    reorder: (ids, mode) => {
      const { doc } = get();
      let objects = [...doc.objects];
      const selected = objects.filter((o) => ids.includes(o.id));
      if (!selected.length) return;
      const rest = objects.filter((o) => !ids.includes(o.id));
      if (mode === 'front') objects = [...rest, ...selected];
      else if (mode === 'back') objects = [...selected, ...rest];
      else {
        const dir = mode === 'forward' ? 1 : -1;
        const order = dir === 1 ? [...objects.keys()].reverse() : [...objects.keys()];
        for (const i of order) {
          const j = i + dir;
          if (j < 0 || j >= objects.length) continue;
          if (ids.includes(objects[i].id) && !ids.includes(objects[j].id)) {
            [objects[i], objects[j]] = [objects[j], objects[i]];
          }
        }
      }
      commit({ ...doc, objects });
    },

    undo: () => {
      const { past, doc, future, selection } = get();
      if (!past.length) return;
      const prev = past[past.length - 1];
      const alive = new Set(prev.objects.map((o) => o.id));
      set({
        doc: prev,
        past: past.slice(0, -1),
        future: [doc, ...future].slice(0, HISTORY_LIMIT),
        selection: selection.filter((s) => alive.has(s)),
        lastCoalesce: null,
      });
    },

    redo: () => {
      const { past, doc, future, selection } = get();
      if (!future.length) return;
      const next = future[0];
      const alive = new Set(next.objects.map((o) => o.id));
      set({
        doc: next,
        past: [...past, doc].slice(-HISTORY_LIMIT),
        future: future.slice(1),
        selection: selection.filter((s) => alive.has(s)),
        lastCoalesce: null,
      });
    },

    reset: () =>
      set({ doc: initialDoc(), past: [], future: [], selection: [], frameName: '', lastCoalesce: null }),
  };
});
