import type Konva from 'konva';
import type { EditorDoc, SlotObject } from './types';

export interface LayoutConfig {
  canvas_width: number;
  canvas_height: number;
  slots: { x: number; y: number; width: number; height: number }[];
}

/** Slot theo thứ tự trong mảng objects — trùng với số hiển thị trên canvas. */
export const getSlots = (doc: EditorDoc): SlotObject[] =>
  doc.objects.filter((o): o is SlotObject => o.type === 'slot');

export function buildLayoutConfig(doc: EditorDoc): LayoutConfig {
  const { width: cw, height: ch } = doc.canvas;
  return {
    canvas_width: cw,
    canvas_height: ch,
    slots: getSlots(doc).map((s) => {
      const x = Math.max(0, Math.round(s.x));
      const y = Math.max(0, Math.round(s.y));
      return {
        x,
        y,
        width: Math.max(1, Math.min(cw - x, Math.round(s.width))),
        height: Math.max(1, Math.min(ch - y, Math.round(s.height))),
      };
    }),
  };
}

export function validateDoc(doc: EditorDoc): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { width: cw, height: ch } = doc.canvas;
  const slots = getSlots(doc);

  if (slots.length === 0) errors.push('Cần ít nhất 1 ô ảnh (slot) để khách chụp vào.');
  if (cw < 100 || ch < 100) errors.push('Kích thước canvas quá nhỏ (tối thiểu 100px).');

  slots.forEach((s, i) => {
    const n = i + 1;
    if (s.width < 10 || s.height < 10) errors.push(`Slot #${n} quá nhỏ (tối thiểu 10×10px).`);
    const fullyOutside = s.x >= cw || s.y >= ch || s.x + s.width <= 0 || s.y + s.height <= 0;
    if (fullyOutside) errors.push(`Slot #${n} nằm hoàn toàn ngoài canvas.`);
    else if (s.x < 0 || s.y < 0 || s.x + s.width > cw || s.y + s.height > ch) {
      warnings.push(`Slot #${n} vượt ra ngoài canvas, sẽ được cắt về trong canvas khi xuất bản.`);
    }
  });

  return { errors, warnings };
}

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Xuất stage thành PNG trong suốt đúng kích thước canvas gốc (canvas.width × canvas.height).
 * Cần bật `exporting` trước để ẩn placeholder/transformer và đục lỗ tại slot.
 */
export async function exportFramePng(stage: Konva.Stage, doc: EditorDoc, zoom: number): Promise<ExportResult> {
  const { width, height } = doc.canvas;

  // Đảm bảo Konva vẽ lại stage với trạng thái exporting mới nhất
  stage.batchDraw();
  stage.draw();

  const raw = stage.toCanvas({ pixelRatio: 1 / zoom });

  // Làm tròn chính xác về kích thước canvas gốc (tránh lệch 1px do zoom lẻ)
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas xuất ảnh');
  ctx.drawImage(raw, 0, 0, width, height);

  const dataUrl = out.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được file PNG'))), 'image/png');
  });

  return { blob, dataUrl };
}

/**
 * Tải file PNG về máy an toàn, ngăn chặn lỗi Chromium bị nuốt file do giới hạn Data URL 2MB
 * Sử dụng Blob URL chuẩn và File System Access API nếu có.
 */
export async function downloadFramePng(
  firstArg: Blob | string,
  secondArg?: Blob | string,
  thirdArg?: string,
): Promise<boolean> {
  let blob: Blob;
  let filename: string;

  if (firstArg instanceof Blob) {
    blob = firstArg;
    filename = (typeof secondArg === 'string' ? secondArg : thirdArg) || 'frame_design';
  } else if (secondArg instanceof Blob) {
    blob = secondArg;
    filename = thirdArg || 'frame_design';
  } else {
    // Nếu chỉ truyền string dataUrl, convert sang Blob an toàn
    const res = await fetch(firstArg);
    blob = await res.blob();
    filename = (typeof secondArg === 'string' ? secondArg : thirdArg) || 'frame_design';
  }

  const cleanBase = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/g, '');
  const safeFilename = `${cleanBase || 'frame_design'}.png`;

  // Cách 1: Sử dụng File System Access API (Hộp thoại chọn nơi lưu chính thức của Windows/Mac)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: safeFilename,
        types: [
          {
            description: 'PNG Image (*.png)',
            accept: { 'image/png': ['.png'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Người dùng nhấn Cancel hộp thoại lưu
        return false;
      }
      console.warn('showSaveFilePicker failed, falling back to blob anchor download', err);
    }
  }

  // Cách 2: Tải bằng Blob URL chuẩn với <a download>
  // Chú ý: TUYỆT ĐỐI KHÔNG dùng Data URL vì Chrome/Edge giới hạn 2MB và sẽ âm thầm hủy tải
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = safeFilename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();

  // Giữ Blob URL sống 60 giây để trình duyệt ghi xong tệp tin vào ổ đĩa
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 60000);

  return true;
}

