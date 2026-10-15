declare module 'gifshot' {
  export interface GifOptions {
    images: string[] | HTMLImageElement[] | HTMLCanvasElement[] | HTMLVideoElement[];
    interval?: number;
    gifWidth?: number;
    gifHeight?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
    progressCallback?: (captureProgress: number) => void;
  }

  export function createGIF(
    options: GifOptions,
    callback: (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => void
  ): void;
}
