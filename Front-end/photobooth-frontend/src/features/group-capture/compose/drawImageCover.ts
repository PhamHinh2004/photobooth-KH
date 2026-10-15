import { LayoutSlot } from '../types';

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap | HTMLImageElement,
  slot: LayoutSlot,
  verticalBias = 0.3, // 0 = top, 0.5 = center
) {
  const sr = img.width / img.height;
  const dr = slot.width / slot.height;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  
  if (sr > dr) { 
    sw = img.height * dr; 
    sx = (img.width - sw) / 2; 
  } else { 
    sh = img.width / dr; 
    sy = (img.height - sh) * verticalBias; 
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.width, slot.height);
}
