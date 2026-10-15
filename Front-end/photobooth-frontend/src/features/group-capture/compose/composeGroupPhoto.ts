import { LayoutConfig } from '../types';
import { drawImageCover } from './drawImageCover';

async function loadImage(url: string): Promise<HTMLImageElement> {
  const candidates = [url];
  if (url.startsWith('http')) {
    const frameUrl = new URL(url);
    if (frameUrl.hostname === 'pub-4eb303709ef24609a3b420990203812a.r2.dev') {
      candidates.unshift(`/r2-proxy${frameUrl.pathname}${frameUrl.search}`);
    }
    candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(url)}`);
  }

  let lastError: unknown;
  for (const candidate of [...new Set(candidates)]) {
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const timeout = window.setTimeout(() => {
          img.src = '';
          reject(new Error(`Timeout khi tải ảnh frame: ${candidate}`));
        }, 15000);
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          window.clearTimeout(timeout);
          resolve(img);
        };
        img.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error(`Không tải được ảnh frame: ${candidate}`));
        };
        img.src = candidate;
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Không tải được ảnh frame');
}

export async function composeGroupPhoto(opts: {
  images: ImageBitmap[]; // Ordered by slotIndex ASC
  layout: LayoutConfig;
  frameImageUrl: string;
}) {
  const { images, layout, frameImageUrl } = opts;
  if (images.length === 0) {
    throw new Error('Không có ảnh nào để ghép');
  }

  const frameImg = await loadImage(frameImageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = layout.canvas_width;
  canvas.height = layout.canvas_height;
  const ctx = canvas.getContext('2d')!;

  // Layer 1 - Original captures (lặp lại ảnh nếu số slot nhiều hơn số ảnh)
  layout.slots.forEach((slot, i) => {
    const img = images[i % images.length];
    drawImageCover(ctx, img, slot);
  });
  
  const originalBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject('Failed to toBlob'), 'image/png');
  });

  // Layer 2 - Frame overlay
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  
  const processedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject('Failed to toBlob'), 'image/png');
  });

  return { originalBlob, processedBlob };
}
