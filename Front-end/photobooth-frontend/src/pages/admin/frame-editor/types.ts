export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'heart';

export interface BaseObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  name?: string;
}

/** Ô ảnh khách hàng. Luôn là hình chữ nhật thẳng (không xoay), hỗ trợ bo góc và viền khung. */
export interface SlotObject extends BaseObject {
  type: 'slot';
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  shadowColor: string;
  shadowBlur: number;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
  fill: string;
  align: 'left' | 'center' | 'right';
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  flipX?: boolean;
  flipY?: boolean;
  isGif?: boolean;
  /** Nếu được ghép vào một ô ảnh (slot) cụ thể */
  slotId?: string;
  clipToSlot?: boolean;
  positionInSlot?: 'left' | 'right' | 'center';
}

export type EditorObject = SlotObject | ShapeObject | TextObject | ImageObject;

export type CanvasBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'transparent' }
  | {
      type: 'image';
      src: string;
      fit?: 'cover' | 'contain' | 'stretch';
      opacity?: number;
    };

export interface EditorDoc {
  canvas: { width: number; height: number; background: CanvasBackground };
  /** Thứ tự mảng = z-order (phần tử cuối nằm trên cùng) */
  objects: EditorObject[];
}

export interface FrameTemplate {
  id: string;
  name: string;
  category: 'vietnam' | 'y2k' | 'vintage' | 'cute' | 'birthday' | 'custom';
  description: string;
  preview: string;
  doc: EditorDoc;
  isCustom?: boolean;
  createdAt?: number;
}

export interface CustomUploadItem {
  id: string;
  name: string;
  src: string;
  category: 'label' | 'logo' | 'character' | 'sticker' | 'gif' | 'other';
  width: number;
  height: number;
  createdAt: number;
  isGif?: boolean;
}

export const CANVAS_PRESETS = [
  { id: 'strip', label: 'Photo Strip 2x6', width: 600, height: 1800 },
  { id: 'portrait', label: 'Dọc 4x6', width: 1200, height: 1800 },
  { id: 'landscape', label: 'Ngang 6x4', width: 1800, height: 1200 },
  { id: 'square', label: 'Vuông', width: 1200, height: 1200 },
] as const;

export const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
];

/** Khớp với enum FrameAspectRatio ở backend */
export const ASPECT_RATIO_OPTIONS = [
  '2x2',
  '1x4',
  '2x3',
  '3x2',
  '3x3',
  '4x2',
  '2x4',
  '2x4_vertical',
  '2x4_horizontal',
  '5_3_2',
  '5_2_3',
  '7_4_3',
  '7_3_4',
];
