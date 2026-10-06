const MAX_BYTES = 800 * 1024; // 800KB

export async function grabJpeg(video: HTMLVideoElement, maxWidth = 1280): Promise<Blob> {
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('Không nén được ảnh dưới 800KB');
}
