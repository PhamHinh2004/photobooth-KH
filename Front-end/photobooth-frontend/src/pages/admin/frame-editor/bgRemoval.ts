import { removeBackground } from '@imgly/background-removal';

export interface BgRemovalOptions {
  method?: 'ai' | 'smart-solid';
  tolerance?: number; // 15 - 80, default 38
  feather?: number;    // 0 - 3, default 1
  onProgress?: (percent: number, statusText: string) => void;
}

/**
 * Thuật toán tách phông nền đơn sắc / phông trắng thông minh (Boundary Flood-Fill):
 * - Bắt đầu loang từ 4 góc và viền trên / viền 2 bên của bức ảnh.
 * - Chỉ xóa những pixel màu nền liên tục kết nối với viền ngoài.
 * - Giữ nguyên áo trắng, chi tiết bên trong người không bị rỗng.
 * - Chạy siêu tốc (< 15ms) ngay trên trình duyệt.
 */
export function removeSolidBackground(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  options?: {
    tolerance?: number;
    feather?: number;
    targetColor?: { r: number; g: number; b: number };
  }
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    try {
      const width = imageElement.width || (imageElement as HTMLImageElement).naturalWidth;
      const height = imageElement.height || (imageElement as HTMLImageElement).naturalHeight;

      if (!width || !height) {
        throw new Error('Kích thước ảnh không hợp lệ');
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D context');

      ctx.drawImage(imageElement, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // 1. Lấy mẫu màu nền từ góc trên và 2 biên trên (nơi chắc chắn là background)
      let bgR = 255, bgG = 255, bgB = 255;
      if (options?.targetColor) {
        bgR = options.targetColor.r;
        bgG = options.targetColor.g;
        bgB = options.targetColor.b;
      } else {
        const samplePoints = [
          [0, 0],
          [width - 1, 0],
          [Math.floor(width / 2), 0],
          [0, Math.floor(height * 0.15)],
          [width - 1, Math.floor(height * 0.15)],
        ];
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (const [sx, sy] of samplePoints) {
          const idx = (sy * width + sx) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
        bgR = Math.round(sumR / count);
        bgG = Math.round(sumG / count);
        bgB = Math.round(sumB / count);
      }

      const tol = options?.tolerance ?? 38;
      const tolSq = tol * tol;

      const visited = new Uint8Array(width * height);
      const isBg = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0;
      let tail = 0;

      const colorDistSq = (idx: number) => {
        const dr = data[idx] - bgR;
        const dg = data[idx + 1] - bgG;
        const db = data[idx + 2] - bgB;
        return dr * dr + dg * dg + db * db;
      };

      // Đẩy viền trên và 2 viền bên vào queue (không đẩy toàn bộ viền đáy để tránh lẹm vào áo trắng)
      for (let x = 0; x < width; x++) {
        const pTop = x;
        if (!visited[pTop]) {
          visited[pTop] = 1;
          if (colorDistSq(pTop * 4) <= tolSq * 1.6) {
            isBg[pTop] = 1;
            queue[tail++] = pTop;
          }
        }
        // Với viền đáy, chỉ lấy 15% biên trái và 15% biên phải (nơi không có thân người)
        if (x < width * 0.18 || x > width * 0.82) {
          const pBottom = (height - 1) * width + x;
          if (!visited[pBottom]) {
            visited[pBottom] = 1;
            if (colorDistSq(pBottom * 4) <= tolSq * 1.6) {
              isBg[pBottom] = 1;
              queue[tail++] = pBottom;
            }
          }
        }
      }

      for (let y = 1; y < height - 1; y++) {
        const pLeft = y * width;
        if (!visited[pLeft]) {
          visited[pLeft] = 1;
          if (colorDistSq(pLeft * 4) <= tolSq * 1.6) {
            isBg[pLeft] = 1;
            queue[tail++] = pLeft;
          }
        }
        const pRight = y * width + (width - 1);
        if (!visited[pRight]) {
          visited[pRight] = 1;
          if (colorDistSq(pRight * 4) <= tolSq * 1.6) {
            isBg[pRight] = 1;
            queue[tail++] = pRight;
          }
        }
      }

      // BFS Flood-fill
      while (head < tail) {
        const p = queue[head++];
        const px = p % width;
        const py = Math.floor(p / width);

        // 4 pixel kề cận
        if (px > 0) {
          const np = p - 1;
          if (!visited[np]) {
            visited[np] = 1;
            if (colorDistSq(np * 4) <= tolSq) {
              isBg[np] = 1;
              queue[tail++] = np;
            }
          }
        }
        if (px < width - 1) {
          const np = p + 1;
          if (!visited[np]) {
            visited[np] = 1;
            if (colorDistSq(np * 4) <= tolSq) {
              isBg[np] = 1;
              queue[tail++] = np;
            }
          }
        }
        if (py > 0) {
          const np = p - width;
          if (!visited[np]) {
            visited[np] = 1;
            if (colorDistSq(np * 4) <= tolSq) {
              isBg[np] = 1;
              queue[tail++] = np;
            }
          }
        }
        if (py < height - 1) {
          const np = p + width;
          if (!visited[np]) {
            visited[np] = 1;
            if (colorDistSq(np * 4) <= tolSq) {
              isBg[np] = 1;
              queue[tail++] = np;
            }
          }
        }
      }

      // Gán alpha = 0 cho vùng nền
      for (let p = 0; p < width * height; p++) {
        if (isBg[p]) {
          data[p * 4 + 3] = 0;
        }
      }

      // Khử răng cưa viền (feathering)
      const feather = options?.feather ?? 1;
      if (feather > 0) {
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const p = y * width + x;
            if (!isBg[p]) {
              const isEdge = isBg[p - 1] || isBg[p + 1] || isBg[p - width] || isBg[p + width];
              if (isEdge) {
                const idx = p * 4;
                const dSq = colorDistSq(idx);
                // Giảm nhẹ alpha ở các pixel giáp ranh để đường viền mềm mại
                const alphaFactor = Math.min(1, Math.max(0.3, dSq / (tolSq * 1.3)));
                data[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Lỗi xuất blob ảnh tách nền'));
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, blob });
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Hàm tách nền tổng hợp thông minh:
 * - Ưu tiên phương pháp người dùng chọn hoặc tự động chọn.
 * - Có cơ chế Fallback: Nếu AI timeout/lỗi mạng thì tự động chuyển sang Smart Solid Removal ngay lập tức!
 */
export async function smartRemoveBackground(
  imageSource: File | Blob | string,
  options?: BgRemovalOptions
): Promise<{ dataUrl: string; blob: Blob; methodUsed: 'ai' | 'smart-solid' }> {
  const method = options?.method ?? 'smart-solid';

  // Load ảnh vào HTMLImageElement
  const img = new window.Image();
  const src =
    typeof imageSource === 'string'
      ? imageSource
      : URL.createObjectURL(imageSource);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
    img.crossOrigin = 'anonymous';
    img.src = src;
  });

  // Nếu người dùng chọn Smart Solid hoặc ảnh có phông trắng/đơn sắc:
  if (method === 'smart-solid') {
    options?.onProgress?.(50, 'Đang phân tích viền ảnh & tách nền siêu tốc...');
    const res = await removeSolidBackground(img, {
      tolerance: options?.tolerance ?? 38,
      feather: options?.feather ?? 1,
    });
    options?.onProgress?.(100, 'Tách nền thành công!');
    return { ...res, methodUsed: 'smart-solid' };
  }

  // Nếu người dùng chọn AI:
  try {
    options?.onProgress?.(20, 'Đang khởi động AI Model tách nền...');
    const aiBlob = await removeBackground(
      typeof imageSource === 'string' ? imageSource : imageSource,
      {
        progress: (_key, current, total) => {
          if (total > 0) {
            const p = Math.round((current / total) * 70) + 20;
            options?.onProgress?.(p, `AI đang xử lý chi tiết (${Math.round(p)}%)...`);
          }
        },
      }
    );
    const dataUrl = URL.createObjectURL(aiBlob);
    options?.onProgress?.(100, 'AI đã tách phông nền thành công!');
    return { dataUrl, blob: aiBlob, methodUsed: 'ai' };
  } catch (aiErr) {
    console.warn('AI Tách nền gặp sự cố, tự động kích hoạt thuật toán Smart Solid:', aiErr);
    options?.onProgress?.(70, 'AI ngoại tuyến, chuyển sang thuật toán thông minh siêu tốc...');
    const res = await removeSolidBackground(img, {
      tolerance: options?.tolerance ?? 38,
      feather: options?.feather ?? 1,
    });
    options?.onProgress?.(100, 'Tách nền thành công!');
    return { ...res, methodUsed: 'smart-solid' };
  }
}
