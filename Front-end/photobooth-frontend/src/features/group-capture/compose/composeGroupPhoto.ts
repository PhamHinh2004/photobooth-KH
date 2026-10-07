import { LayoutConfig } from '../types';
import { drawImageCover } from './drawImageCover';

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Nếu là URL bên ngoài (không phải data: URI), dùng proxy để bypass CORS policy
    const proxyUrl = url.startsWith('http') 
      ? `https://wsrv.nl/?url=${encodeURIComponent(url)}` 
      : url;
    img.src = proxyUrl;
  });
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
