// Types cho Photos module
export interface LayoutSlot {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutConfig {
  canvas_width: number
  canvas_height: number
  slots: LayoutSlot[]
}

export interface Frame {
  id: string
  name: string
  image_url: string
  thumbnail_url: string
  aspect_ratio: string
  session_type_supported: string
  layout_config: LayoutConfig
  sort_order: number
  is_active: boolean
  category?: string
  tags?: string[]
}

export interface PhotoRecord {
  id: string
  customer_id: string
  frame_id: string | null
  media_type: string
  session_type: string
  original_file_url: string
  processed_file_url: string | null
  thumbnail_url: string | null
  status: string
  share_token: string
  download_count: number
  created_at: string
}

export interface RecordingRecord {
  id: string
  file_url: string | null
  thumbnail_url: string | null
  status: string
}

export interface GifRecord {
  id: string
  gif_type: string
  image_url: string
}

export type CaptureStep = 
  | 'package-select'
  | 'frame-select'
  | 'capturing'
  | 'review'
  | 'filter'
  | 'result'

export interface PackageOption {
  id: string
  title: string
  subtitle: string
  slotsCount: number
  shotsCount: number
  dimensions: string
  icon: string
  category: 'strip' | 'grid' | 'large'
  isPopular?: boolean
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  cssFilter: string
  brightness: number
  contrast: number
  saturate: number
  sepia: number
  hueRotate: number
}

export interface PhotoSticker {
  id: string
  src: string
  label: string
  x: number
  y: number
  size: number
  rotation: number
  outlineColor: string
}
