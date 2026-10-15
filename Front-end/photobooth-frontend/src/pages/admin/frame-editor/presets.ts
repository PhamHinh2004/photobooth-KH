import type { FrameTemplate } from './types';
import baseFramesData from '@/data/base_frames.json';

export interface BaseFrameLayout {
  id: string;
  name: string;
  category: 'strip' | 'grid' | 'group';
  aspectRatio: string;
  width: number;
  height: number;
  slots: { x: number; y: number; width: number; height: number }[];
  slotCount: number;
  sessionType: 'single' | 'group' | 'both';
  badge: string;
  description: string;
  tagline: string;
}

export const BASE_FRAME_PRESETS: BaseFrameLayout[] = [
  {
    id: '1x4',
    name: 'Photo Strip 1x4 (2x6")',
    category: 'strip',
    aspectRatio: '1x4',
    width: 221,
    height: 959,
    slotCount: 4,
    sessionType: 'both',
    badge: 'Strip Dọc',
    description: 'Dải 4 ảnh dọc Photostrip Hàn Quốc kinh điển',
    tagline: '4 ô ảnh · 221×959px',
    slots: baseFramesData.find((f) => f.id === '1x4')?.layout_config.slots || [],
  },
  {
    id: '2x2',
    name: 'Lưới vuông 2x2',
    category: 'grid',
    aspectRatio: '2x2',
    width: 418,
    height: 537,
    slotCount: 4,
    sessionType: 'both',
    badge: 'Phổ biến',
    description: 'Khung 4 ảnh chia đều 2 hàng 2 cột',
    tagline: '4 ô ảnh · 418×537px',
    slots: baseFramesData.find((f) => f.id === '2x2')?.layout_config.slots || [],
  },
  {
    id: '2x3',
    name: 'Lưới dọc 2x3',
    category: 'grid',
    aspectRatio: '2x3',
    width: 418,
    height: 748,
    slotCount: 6,
    sessionType: 'both',
    badge: '6 ảnh dọc',
    description: 'Khung 6 ảnh dọc (3 hàng × 2 cột)',
    tagline: '6 ô ảnh · 418×748px',
    slots: baseFramesData.find((f) => f.id === '2x3')?.layout_config.slots || [],
  },
  {
    id: '3x2',
    name: 'Lưới ngang 3x2',
    category: 'grid',
    aspectRatio: '3x2',
    width: 615,
    height: 537,
    slotCount: 6,
    sessionType: 'both',
    badge: '6 ảnh ngang',
    description: 'Khung 6 ảnh ngang (2 hàng × 3 cột)',
    tagline: '6 ô ảnh · 615×537px',
    slots: baseFramesData.find((f) => f.id === '3x2')?.layout_config.slots || [],
  },
  {
    id: '2x4',
    name: 'Photo Strip đôi 2x4',
    category: 'strip',
    aspectRatio: '2x4',
    width: 418,
    height: 959,
    slotCount: 8,
    sessionType: 'single',
    badge: 'Dải đôi 8 ô',
    description: 'Khung dọc 8 ảnh (4 hàng × 2 cột)',
    tagline: '8 ô ảnh · 418×959px',
    slots: baseFramesData.find((f) => f.id === '2x4')?.layout_config.slots || [],
  },
  {
    id: '4x2',
    name: 'Toàn cảnh 4x2',
    category: 'grid',
    aspectRatio: '4x2',
    width: 812,
    height: 537,
    slotCount: 8,
    sessionType: 'both',
    badge: '8 ảnh ngang',
    description: 'Khung rộng ngang 8 ảnh (2 hàng × 4 cột)',
    tagline: '8 ô ảnh · 812×537px',
    slots: baseFramesData.find((f) => f.id === '4x2')?.layout_config.slots || [],
  },
  {
    id: '5p_3-2',
    name: 'Nhóm 5P (3 trên · 2 dưới)',
    category: 'group',
    aspectRatio: '5_3_2',
    width: 615,
    height: 537,
    slotCount: 5,
    sessionType: 'both',
    badge: 'Nhóm 5 người',
    description: 'Bố cục 5 người so le (3 trên - 2 dưới)',
    tagline: '5 ô ảnh · 615×537px',
    slots: baseFramesData.find((f) => f.id === '5p_3-2')?.layout_config.slots || [],
  },
  {
    id: '5p_2-3',
    name: 'Nhóm 5P (2 trên · 3 dưới)',
    category: 'group',
    aspectRatio: '5_2_3',
    width: 615,
    height: 537,
    slotCount: 5,
    sessionType: 'both',
    badge: 'Nhóm 5 người',
    description: 'Bố cục 5 người so le (2 trên - 3 dưới)',
    tagline: '5 ô ảnh · 615×537px',
    slots: baseFramesData.find((f) => f.id === '5p_2-3')?.layout_config.slots || [],
  },
  {
    id: '7p_4-3',
    name: 'Nhóm 7P (4 trên · 3 dưới)',
    category: 'group',
    aspectRatio: '7_4_3',
    width: 812,
    height: 537,
    slotCount: 7,
    sessionType: 'both',
    badge: 'Nhóm 7 người',
    description: 'Bố cục 7 người so le (4 trên - 3 dưới)',
    tagline: '7 ô ảnh · 812×537px',
    slots: baseFramesData.find((f) => f.id === '7p_4-3')?.layout_config.slots || [],
  },
  {
    id: '7p_3-4',
    name: 'Nhóm 7P (3 trên · 4 dưới)',
    category: 'group',
    aspectRatio: '7_3_4',
    width: 812,
    height: 537,
    slotCount: 7,
    sessionType: 'both',
    badge: 'Nhóm 7 người',
    description: 'Bố cục 7 người so le (3 trên - 4 dưới)',
    tagline: '7 ô ảnh · 812×537px',
    slots: baseFramesData.find((f) => f.id === '7p_3-4')?.layout_config.slots || [],
  },
];

export const normalizeAspectRatioForBackend = (ratio?: string): string | undefined => {
  if (!ratio) return undefined;
  const map: Record<string, string> = {
    '5p_3-2': '5_3_2',
    '5p_2-3': '5_2_3',
    '7p_4-3': '7_4_3',
    '7p_3-4': '7_3_4',
  };
  const normalized = map[ratio] || ratio;
  const valid = [
    '2x2', '1x4', '2x3', '3x2', '3x3', '4x2', '2x4',
    '2x4_vertical', '2x4_horizontal', '5_3_2', '5_2_3', '7_4_3', '7_3_4'
  ];
  return valid.includes(normalized) ? normalized : undefined;
};

// Preset Backgrounds, Stickers, Icons, GIF & Templates for Frame Editor
// High quality SVG data URIs that work offline and with html2canvas/konva without CORS issues.

export type AssetCategory =
  | 'all'
  | 'label'
  | 'vietnam'
  | 'celebrity'
  | 'character'
  | 'y2k'
  | 'vintage'
  | 'cute'
  | 'birthday'
  | 'icon'
  | 'gif';

export interface PresetBackground {
  id: string;
  name: string;
  category: 'y2k' | 'cute' | 'vintage' | 'minimal' | 'vietnam' | 'gradient';
  src: string;
  preview: string;
}

export interface PresetAsset {
  id: string;
  name: string;
  category: AssetCategory;
  src: string;
  preview?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  isGif?: boolean;
}

// Helper to encode SVG string to data URI
export const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// ==========================================
// 1. MẪU NỀN FRAME (PRESET BACKGROUNDS)
// ==========================================
export const PRESET_BACKGROUNDS: PresetBackground[] = [

  {
    id: 'military-heritage-green',
    name: 'Quân Đội & Rêu Vintage (1944)',
    category: 'vietnam',
    preview: '#2e4a2a',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <defs>
          <linearGradient id="camoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#284325"/>
            <stop offset="50%" stop-color="#1f361d"/>
            <stop offset="100%" stop-color="#2e4d2a"/>
          </linearGradient>
          <pattern id="leafCamo" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 30,50 Q 80,20 120,60 Q 90,110 30,50 Z" fill="#35562f" opacity="0.35"/>
            <path d="M 140,120 Q 180,80 190,140 Q 150,180 140,120 Z" fill="#1b2e19" opacity="0.45"/>
            <path d="M 50,150 Q 20,180 70,190 Q 90,150 50,150 Z" fill="#3b5f35" opacity="0.3"/>
            <path d="M 120,20 Q 160,10 170,40 Q 130,50 120,20 Z" fill="#243d22" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="600" height="1800" fill="url(#camoGrad)"/>
        <rect width="600" height="1800" fill="url(#leafCamo)"/>
        <!-- Star watermark watermark -->
        <g fill="#ffffff" opacity="0.04">
          <polygon points="300,100 315,145 365,145 325,175 340,220 300,190 260,220 275,175 235,145 285,145"/>
          <polygon points="120,700 135,745 185,745 145,775 160,820 120,790 80,820 95,775 55,745 105,745"/>
          <polygon points="480,1300 495,1345 545,1345 505,1375 520,1420 480,1390 440,1420 455,1375 415,1345 465,1345"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'y2k-grid-pink',
    name: 'Y2K Cyber Pink Grid',
    category: 'y2k',
    preview: '#ff758c',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff9a9e"/>
            <stop offset="50%" stop-color="#fecfef"/>
            <stop offset="100%" stop-color="#a1c4fd"/>
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
          </pattern>
        </defs>
        <rect width="600" height="1800" fill="url(#bgGrad)"/>
        <rect width="600" height="1800" fill="url(#grid)"/>
        <circle cx="100" cy="200" r="180" fill="rgba(255,255,255,0.2)" filter="blur(40px)"/>
        <circle cx="500" cy="1500" r="220" fill="rgba(255,105,180,0.25)" filter="blur(50px)"/>
      </svg>
    `),
  },
  {
    id: 'lavender-aesthetic',
    name: 'Lilac Dream Pastel',
    category: 'cute',
    preview: '#d8b4e2',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <defs>
          <linearGradient id="lavenderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e0c3fc"/>
            <stop offset="50%" stop-color="#8ec5fc"/>
            <stop offset="100%" stop-color="#e0c3fc"/>
          </linearGradient>
        </defs>
        <rect width="600" height="1800" fill="url(#lavenderGrad)"/>
        <g opacity="0.3" fill="#ffffff">
          <circle cx="80" cy="300" r="4"/>
          <circle cx="520" cy="500" r="5"/>
          <circle cx="120" cy="900" r="6"/>
          <circle cx="480" cy="1200" r="4"/>
          <circle cx="90" cy="1600" r="5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'vintage-film-retro',
    name: 'Vintage Film Strip',
    category: 'vintage',
    preview: '#232526',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <defs>
          <linearGradient id="filmDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1f1c2c"/>
            <stop offset="100%" stop-color="#928dab"/>
          </linearGradient>
        </defs>
        <rect width="600" height="1800" fill="url(#filmDark)"/>
        <g fill="rgba(255,255,255,0.15)">
          ${Array.from({ length: 30 }, (_, i) => `
            <rect x="8" y="${i * 60 + 20}" width="16" height="24" rx="4"/>
            <rect x="576" y="${i * 60 + 20}" width="16" height="24" rx="4"/>
          `).join('')}
        </g>
      </svg>
    `),
  },
  {
    id: 'sweet-cherries-kawaii',
    name: 'Sweet Heart & Polka Dot',
    category: 'cute',
    preview: '#ffdde1',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <rect width="600" height="1800" fill="#fff5f5"/>
        <defs>
          <pattern id="polka" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="4" fill="#ffccd5" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="600" height="1800" fill="url(#polka)"/>
      </svg>
    `),
  },
  {
    id: 'cyberpunk-neon-glow',
    name: 'Cyberpunk Neon Glow',
    category: 'y2k',
    preview: '#0f0c29',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <rect width="600" height="1800" fill="#0d081f"/>
        <circle cx="300" cy="300" r="280" fill="rgba(255,0,128,0.2)" filter="blur(60px)"/>
        <circle cx="300" cy="1200" r="280" fill="rgba(0,255,200,0.18)" filter="blur(60px)"/>
      </svg>
    `),
  },
  {
    id: 'korean-studio-minimal',
    name: 'Korean Studio Minimal',
    category: 'minimal',
    preview: '#f5f5f7',
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800">
        <rect width="600" height="1800" fill="#f8f9fa"/>
        <rect x="20" y="20" width="560" height="1760" fill="none" stroke="#e9ecef" stroke-width="2"/>
      </svg>
    `),
  },
];

// ==========================================
// 2. KHO NHÂN VẬT, ICON & STICKER PHONG PHÚ
// ==========================================
export const PRESET_CHARACTERS_AND_STICKERS: PresetAsset[] = [
  // 🏷️ 0. NHÃN DÁN, WASHI TAPE & BADGES THƯƠNG HIỆU
  {
    id: 'washi-tape-pink',
    name: 'Washi Tape Hồng Pastel (Dán Góc)',
    category: 'label',
    defaultWidth: 150,
    defaultHeight: 45,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 45" width="150" height="45">
        <!-- Băng dính Washi tape cạnh răng cưa dán mép/góc ảnh -->
        <polygon points="5,5 145,5 142,40 2,40" fill="#ffb4a2" opacity="0.85"/>
        <g stroke="#ffffff" stroke-width="1.5" opacity="0.6">
          <line x1="20" y1="5" x2="35" y2="40"/>
          <line x1="45" y1="5" x2="60" y2="40"/>
          <line x1="70" y1="5" x2="85" y2="40"/>
          <line x1="95" y1="5" x2="110" y2="40"/>
          <line x1="120" y1="5" x2="135" y2="40"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'washi-tape-mint-grid',
    name: 'Washi Tape Mint Caro (Dán Góc)',
    category: 'label',
    defaultWidth: 150,
    defaultHeight: 45,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 45" width="150" height="45">
        <polygon points="3,5 147,5 144,40 5,40" fill="#b7e4c7" opacity="0.88"/>
        <!-- Lưới caro -->
        <g stroke="#52b788" stroke-width="1" opacity="0.5">
          <line x1="0" y1="15" x2="150" y2="15"/>
          <line x1="0" y1="28" x2="150" y2="28"/>
          <line x1="25" y1="5" x2="25" y2="40"/>
          <line x1="55" y1="5" x2="55" y2="40"/>
          <line x1="85" y1="5" x2="85" y2="40"/>
          <line x1="115" y1="5" x2="115" y2="40"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'label-kh-booth-stamp',
    name: 'Tem Con Dấu "KH BOOTH PHOTO STUDIO"',
    category: 'label',
    defaultWidth: 110,
    defaultHeight: 110,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="110" height="110">
        <!-- Con dấu tròn retro vintage đỏ mộc -->
        <circle cx="55" cy="55" r="48" fill="none" stroke="#d90429" stroke-width="3" stroke-dasharray="8,3"/>
        <circle cx="55" cy="55" r="42" fill="none" stroke="#d90429" stroke-width="1.5"/>
        <path id="curveTop" d="M 22 55 A 33 33 0 0 1 88 55" fill="none"/>
        <text font-family="'Courier New', monospace" font-size="9" font-weight="900" fill="#d90429" letter-spacing="1">
          <textPath href="#curveTop" startOffset="50%" text-anchor="middle">★ KH BOOTH ★</textPath>
        </text>
        <text x="55" y="60" text-anchor="middle" font-family="Impact, sans-serif" font-size="16" font-weight="bold" fill="#d90429">PHOTO</text>
        <text x="55" y="74" text-anchor="middle" font-family="'Courier New', monospace" font-size="8" font-weight="bold" fill="#d90429">STUDIO '24</text>
      </svg>
    `),
  },
  {
    id: 'label-premium-badge',
    name: 'Huy Hiệu "PREMIUM PHOTOBOOTH" Vàng Gold',
    category: 'label',
    defaultWidth: 180,
    defaultHeight: 60,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60" width="180" height="60">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffd166"/>
            <stop offset="50%" stop-color="#f4a261"/>
            <stop offset="100%" stop-color="#e76f51"/>
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="170" height="50" rx="25" fill="#1b2a47" stroke="url(#goldGrad)" stroke-width="2.5"/>
        <text x="90" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#ffd166" letter-spacing="2">★ PREMIUM ★</text>
        <text x="90" y="44" text-anchor="middle" font-family="Impact, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="1">PHOTOBOOTH</text>
      </svg>
    `),
  },
  {
    id: 'label-best-moments',
    name: 'Nhãn Dán Pastel "BEST MOMENTS"',
    category: 'label',
    defaultWidth: 160,
    defaultHeight: 48,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" width="160" height="48">
        <rect x="4" y="4" width="152" height="40" rx="10" fill="#f8edeb" stroke="#fcd5ce" stroke-width="2"/>
        <text x="80" y="29" text-anchor="middle" font-family="'Comic Sans MS', cursive, sans-serif" font-size="14" font-weight="bold" fill="#f28482">♥ Best Moments ♥</text>
      </svg>
    `),
  },
  // 🇻🇳 1. VIỆT NAM & KỶ NIỆM (Phong cách Frame mẫu của khách)
  {
    id: 'vn-bunting-flags',
    name: 'Dây Cờ Đỏ Sao Vàng (Treo Ngang)',
    category: 'vietnam',
    defaultWidth: 520,
    defaultHeight: 75,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 75" width="520" height="75">
        <!-- Dây treo uốn lượn -->
        <path d="M 10 18 Q 135 48 260 22 Q 385 52 510 18" stroke="#d4af37" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- 5 lá cờ đỏ tam giác sao vàng -->
        <!-- Lá 1 -->
        <g transform="translate(45, 24) rotate(-6)">
          <polygon points="0,0 60,0 30,50" fill="#d90429" stroke="#b00020" stroke-width="1.5"/>
          <polygon points="30,12 34,22 44,22 36,28 39,38 30,32 21,38 24,28 16,22 26,22" fill="#ffd166"/>
        </g>
        <!-- Lá 2 -->
        <g transform="translate(145, 34) rotate(4)">
          <polygon points="0,0 60,0 30,50" fill="#d90429" stroke="#b00020" stroke-width="1.5"/>
          <polygon points="30,12 34,22 44,22 36,28 39,38 30,32 21,38 24,28 16,22 26,22" fill="#ffd166"/>
        </g>
        <!-- Lá 3 (chính giữa) -->
        <g transform="translate(230, 22) rotate(-2)">
          <polygon points="0,0 64,0 32,54" fill="#d90429" stroke="#b00020" stroke-width="1.5"/>
          <polygon points="32,13 36,24 47,24 38,30 41,41 32,34 23,41 26,30 17,24 28,24" fill="#ffd166"/>
        </g>
        <!-- Lá 4 -->
        <g transform="translate(325, 34) rotate(-5)">
          <polygon points="0,0 60,0 30,50" fill="#d90429" stroke="#b00020" stroke-width="1.5"/>
          <polygon points="30,12 34,22 44,22 36,28 39,38 30,32 21,38 24,28 16,22 26,22" fill="#ffd166"/>
        </g>
        <!-- Lá 5 -->
        <g transform="translate(415, 24) rotate(7)">
          <polygon points="0,0 60,0 30,50" fill="#d90429" stroke="#b00020" stroke-width="1.5"/>
          <polygon points="30,12 34,22 44,22 36,28 39,38 30,32 21,38 24,28 16,22 26,22" fill="#ffd166"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'vn-corner-ribbon',
    name: 'Ruy Băng Cờ Đỏ Sao Vàng (Góc)',
    category: 'vietnam',
    defaultWidth: 220,
    defaultHeight: 95,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 95" width="220" height="95">
        <defs>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e63946"/>
            <stop offset="100%" stop-color="#b7094c"/>
          </linearGradient>
        </defs>
        <!-- Dải lụa đỏ uốn lượn chéo góc -->
        <path d="M 0 45 Q 60 10 130 35 Q 180 50 220 20 L 220 65 Q 180 90 120 70 Q 60 50 0 85 Z" fill="url(#ribbonGrad)" stroke="#ffb703" stroke-width="2"/>
        <!-- Ngôi sao vàng trên ruy băng -->
        <g transform="translate(155, 38) rotate(12)">
          <polygon points="18,0 22,12 35,12 24,20 28,32 18,25 8,32 12,20 1,12 14,12" fill="#ffb703"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'vn-tank-stamp',
    name: 'Tem Xe Tăng & Ngày Lịch Sử 1944.12.22',
    category: 'vietnam',
    defaultWidth: 200,
    defaultHeight: 90,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" width="200" height="90">
        <!-- Khung tem bo tròn vintage màu rêu sẫm -->
        <rect x="5" y="5" width="190" height="80" rx="14" fill="#1b2818" stroke="#d4af37" stroke-width="3"/>
        <rect x="9" y="9" width="182" height="72" rx="10" fill="none" stroke="#d4af37" stroke-width="1" stroke-dasharray="4,3"/>
        <!-- Xe tăng silhouette phong cách tem quân đội -->
        <g fill="#d4af37" transform="translate(30, 20) scale(0.65)">
          <path d="M 20 35 L 75 35 L 85 45 L 80 55 L 10 55 L 5 45 Z"/>
          <ellipse cx="45" cy="28" rx="22" ry="12"/>
          <rect x="50" y="24" width="45" height="5" rx="2"/>
          <!-- Bánh xích xe tăng -->
          <circle cx="20" cy="50" r="5" fill="#1b2818"/>
          <circle cx="35" cy="50" r="5" fill="#1b2818"/>
          <circle cx="50" cy="50" r="5" fill="#1b2818"/>
          <circle cx="65" cy="50" r="5" fill="#1b2818"/>
        </g>
        <!-- Chữ ngày 1944.12.22 -->
        <text x="100" y="44" font-family="'Courier New', Impact, sans-serif" font-size="20" font-weight="900" fill="#ffd166" letter-spacing="2">1944.12.22</text>
        <text x="100" y="64" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" letter-spacing="1">QĐND VIỆT NAM</text>
      </svg>
    `),
  },
  {
    id: 'vn-photo-object-badge',
    name: 'Tem Nhãn "PHOTO OBJECT" Stencil',
    category: 'vietnam',
    defaultWidth: 260,
    defaultHeight: 50,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 50" width="260" height="50">
        <!-- Chữ PHOTO OBJECT phong cách retro quân đội nổi bật -->
        <text x="130" y="36" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="34" font-weight="900" fill="#f4a261" stroke="#000" stroke-width="1.5" letter-spacing="3">PHOTO OBJECT</text>
      </svg>
    `),
  },
  {
    id: 'vn-vivid-season-badge',
    name: 'Huy Hiệu "2024 VIVID SEASON"',
    category: 'vietnam',
    defaultWidth: 130,
    defaultHeight: 65,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 65" width="130" height="65">
        <path d="M 10 10 L 115 5 C 125 15, 125 45, 115 55 L 10 50 Z" fill="#ffffff" stroke="#264653" stroke-width="2.5"/>
        <text x="60" y="28" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="11" font-weight="bold" fill="#e76f51">2024 VIVID</text>
        <text x="60" y="44" text-anchor="middle" font-family="Impact, sans-serif" font-size="16" font-weight="bold" fill="#264653">SEASON</text>
      </svg>
    `),
  },
  {
    id: 'vn-sparkle-red-gold',
    name: 'Ngôi Sao 4 Cánh Đỏ Viền Vàng (Sparkles)',
    category: 'vietnam',
    defaultWidth: 70,
    defaultHeight: 70,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" width="70" height="70">
        <!-- Sao 4 cánh lấp lánh màu đỏ viền vàng giống ảnh mẫu -->
        <g transform="translate(35, 35)">
          <path d="M 0,-32 Q 4,-6 32,0 Q 4,6 0,32 Q -4,6 -32,0 Q -4,-6 0,-32 Z" fill="#d90429" stroke="#ffd166" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="4" fill="#ffd166"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'vn-flag-waving',
    name: 'Cờ Đỏ Sao Vàng Bay Lượn',
    category: 'vietnam',
    defaultWidth: 160,
    defaultHeight: 120,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
        <!-- Cột cờ -->
        <line x1="20" y1="10" x2="20" y2="115" stroke="#4a5568" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="10" r="5" fill="#d4af37"/>
        <!-- Lá cờ gợn sóng -->
        <path d="M 22 15 Q 60 5 95 20 Q 130 35 150 20 L 150 75 Q 120 95 90 75 Q 55 60 22 75 Z" fill="#da251d"/>
        <!-- Sao vàng ở giữa -->
        <g transform="translate(82, 45)">
          <polygon points="0,-18 5,-5 18,-5 8,3 12,16 0,8 -12,16 -8,3 -18,-5 -5,-5" fill="#ffff00"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'vn-lotus-gold',
    name: 'Biểu Tượng Hoa Sen Vàng',
    category: 'vietnam',
    defaultWidth: 120,
    defaultHeight: 100,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100">
        <g fill="#f4a261" stroke="#d4af37" stroke-width="1.5">
          <!-- Cánh chính giữa -->
          <path d="M 60 15 C 50 35 50 70 60 80 C 70 70 70 35 60 15 Z" fill="#ffd166"/>
          <!-- 2 cánh bên trong -->
          <path d="M 60 80 C 45 70 35 40 45 25 C 55 45 55 70 60 80 Z"/>
          <path d="M 60 80 C 75 70 85 40 75 25 C 65 45 65 70 60 80 Z"/>
          <!-- 2 cánh xoè bên ngoài -->
          <path d="M 60 80 C 35 75 15 55 25 40 C 40 60 50 75 60 80 Z" fill="#e76f51"/>
          <path d="M 60 80 C 85 75 105 55 95 40 C 80 60 70 75 60 80 Z" fill="#e76f51"/>
        </g>
      </svg>
    `),
  },

  // 🌟 2. NGƯỜI NỔI TIẾNG / IDOL (PHONG CÁCH PHOTO STAR & LIFE4CUTS)
  {
    id: 'idol-photostar-1-pink',
    name: 'Idol Nam 1 (Áo Caro Hồng - Chỉ Má Cute)',
    category: 'celebrity',
    defaultWidth: 240,
    defaultHeight: 320,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
        <defs>
          <linearGradient id="skin1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff0ea"/>
            <stop offset="100%" stop-color="#fcd5ce"/>
          </linearGradient>
          <pattern id="pinkPlaid" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#f8d7da"/>
            <rect width="8" height="16" fill="#f1aeb5" opacity="0.6"/>
            <rect width="16" height="8" fill="#ea868f" opacity="0.4"/>
          </pattern>
        </defs>
        <!-- Thân áo sơ mi caro hồng -->
        <path d="M 45 130 Q 100 145 155 130 L 165 280 L 35 280 Z" fill="url(#pinkPlaid)"/>
        <!-- Áo phông trắng lót bên trong -->
        <polygon points="85,135 115,135 110,180 90,180" fill="#ffffff"/>
        <!-- Cổ & Cằm -->
        <rect x="85" y="115" width="30" height="25" rx="5" fill="url(#skin1)"/>
        <!-- Khuôn mặt V-line -->
        <path d="M 65 70 C 65 115 80 128 100 128 C 120 128 135 115 135 70 C 135 35 65 35 65 70 Z" fill="url(#skin1)"/>
        <!-- Má hồng dễ thương -->
        <ellipse cx="78" cy="98" rx="8" ry="5" fill="#ff758f" opacity="0.6"/>
        <ellipse cx="122" cy="98" rx="8" ry="5" fill="#ff758f" opacity="0.6"/>
        <!-- Đôi mắt cười long lanh -->
        <path d="M 76 82 Q 83 77 90 82" stroke="#2b2d42" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 110 82 Q 117 77 124 82" stroke="#2b2d42" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Nụ cười chúm chím dễ thương -->
        <ellipse cx="100" cy="108" rx="4" ry="3" fill="#e63946"/>
        <!-- Mũi -->
        <ellipse cx="100" cy="94" rx="2" ry="2" fill="#d90429" opacity="0.3"/>
        <!-- Tóc nam Idol rẽ ngôi đen óng -->
        <path d="M 60 70 C 58 30 75 15 100 15 C 125 15 142 30 140 70 C 130 50 115 42 100 42 C 85 42 70 50 60 70 Z" fill="#212529"/>
        <path d="M 65 55 Q 85 30 98 46" fill="#343a40"/>
        <path d="M 135 55 Q 115 30 102 46" fill="#343a40"/>
        <!-- 2 bàn tay ngón trỏ chỉ vào 2 gò má (Dáng pose Cheek Poke) -->
        <!-- Tay trái chỉ má -->
        <g transform="translate(62, 92) rotate(25)">
          <rect x="-18" y="0" width="22" height="9" rx="4.5" fill="url(#skin1)"/>
          <ellipse cx="4" cy="4" rx="4" ry="4" fill="url(#skin1)"/>
          <!-- Vòng tay áo sơ mi caro -->
          <rect x="-35" y="-5" width="20" height="18" rx="4" fill="url(#pinkPlaid)"/>
        </g>
        <!-- Tay phải chỉ má -->
        <g transform="translate(138, 92) rotate(-25)">
          <rect x="-4" y="0" width="22" height="9" rx="4.5" fill="url(#skin1)"/>
          <ellipse cx="-4" cy="4" rx="4" ry="4" fill="url(#skin1)"/>
          <!-- Vòng tay áo sơ mi caro -->
          <rect x="15" y="-5" width="20" height="18" rx="4" fill="url(#pinkPlaid)"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'idol-photostar-2-selfie',
    name: 'Idol Nam 2 (Áo Sát Nách Austin - Selfie)',
    category: 'celebrity',
    defaultWidth: 240,
    defaultHeight: 320,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
        <defs>
          <linearGradient id="skin2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff3ea"/>
            <stop offset="100%" stop-color="#fedac9"/>
          </linearGradient>
        </defs>
        <!-- Thân áo sát nách (Tank top) màu đen than -->
        <path d="M 52 135 L 148 135 L 160 280 L 40 280 Z" fill="#1e293b"/>
        <!-- Cổ khoét sâu áo sát nách -->
        <path d="M 75 135 Q 100 165 125 135 Z" fill="url(#skin2)"/>
        <!-- Chữ AUSTIN 3:16 in trên ngực áo -->
        <text x="100" y="195" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="16" font-weight="900" fill="#f8fafc" letter-spacing="1">AUSTIN</text>
        <text x="100" y="215" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="18" font-weight="900" fill="#f59e0b" letter-spacing="1">3:16</text>
        <!-- Cổ & Khuôn mặt -->
        <rect x="86" y="115" width="28" height="25" rx="5" fill="url(#skin2)"/>
        <path d="M 68 70 C 68 115 82 126 100 126 C 118 126 132 115 132 70 C 132 35 68 35 68 70 Z" fill="url(#skin2)"/>
        <!-- Mắt cá tính, chu môi pose selfie -->
        <ellipse cx="85" cy="80" rx="4" ry="5" fill="#0f172a"/>
        <ellipse cx="115" cy="80" rx="4" ry="5" fill="#0f172a"/>
        <circle cx="86" cy="78" r="1.5" fill="#ffffff"/>
        <circle cx="116" cy="78" r="1.5" fill="#ffffff"/>
        <!-- Chu môi kiểu duck-face selfie -->
        <ellipse cx="100" cy="106" rx="5" ry="4" fill="#e11d48"/>
        <!-- Tóc vuốt nhuộm màu xám khói ánh vàng -->
        <path d="M 64 68 C 62 25 78 12 100 12 C 122 12 136 25 136 68 C 128 46 114 38 100 38 C 86 38 72 46 64 68 Z" fill="#94a3b8"/>
        <path d="M 70 50 Q 100 18 120 40" fill="#cbd5e1" opacity="0.7"/>
        <!-- Tay cầm điện thoại iPhone chụp selfie -->
        <g transform="translate(112, 105) rotate(-10)">
          <!-- Cánh tay nâng lên -->
          <rect x="0" y="20" width="22" height="45" rx="10" fill="url(#skin2)"/>
          <!-- Chiếc điện thoại thông minh viền đen -->
          <rect x="-8" y="-15" width="34" height="60" rx="8" fill="#020617" stroke="#475569" stroke-width="2"/>
          <rect x="-4" y="-11" width="26" height="52" rx="5" fill="#1e293b"/>
          <!-- Cụm camera sau 3 mắt -->
          <circle cx="2" cy="-4" r="3" fill="#000000" stroke="#64748b" stroke-width="1"/>
          <circle cx="14" cy="-4" r="3" fill="#000000" stroke="#64748b" stroke-width="1"/>
          <circle cx="8" cy="6" r="3" fill="#000000" stroke="#64748b" stroke-width="1"/>
          <!-- Bàn tay nắm thân máy -->
          <ellipse cx="12" cy="18" rx="8" ry="6" fill="url(#skin2)"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'idol-photostar-3-glasses',
    name: 'Idol Nam 3 (Kính Sinh Nhật Party Bánh Kem)',
    category: 'celebrity',
    defaultWidth: 240,
    defaultHeight: 320,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
        <defs>
          <linearGradient id="skin3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff5ee"/>
            <stop offset="100%" stop-color="#fed7c3"/>
          </linearGradient>
        </defs>
        <!-- Áo sơ mi be sữa nhã nhặn -->
        <path d="M 45 130 Q 100 145 155 130 L 165 280 L 35 280 Z" fill="#fef08a" opacity="0.85"/>
        <polygon points="85,135 115,135 110,180 90,180" fill="#ffffff"/>
        <!-- Cổ & Khuôn mặt -->
        <rect x="85" y="115" width="30" height="25" rx="5" fill="url(#skin3)"/>
        <path d="M 65 70 C 65 115 80 128 100 128 C 120 128 135 115 135 70 C 135 35 65 35 65 70 Z" fill="url(#skin3)"/>
        <!-- Nụ cười tươi -->
        <path d="M 88 106 Q 100 118 112 106" stroke="#b91c1c" stroke-width="3" fill="#ffffff"/>
        <!-- CẶP KÍNH SINH NHẬT BÁNH KEM ĐỘC ĐÁO (Hình dáng như ảnh mẫu 3) -->
        <g transform="translate(48, 62)">
          <!-- Tròng kính tròn đỏ ngộ nghĩnh -->
          <circle cx="28" cy="22" r="18" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2"/>
          <circle cx="76" cy="22" r="18" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2"/>
          <rect x="44" y="20" width="16" height="4" fill="#f43f5e"/>
          <!-- Bánh kem và nến sinh nhật trên gọng kính -->
          <rect x="15" y="-4" width="26" height="12" rx="3" fill="#ffffff" stroke="#f43f5e" stroke-width="1.5"/>
          <rect x="63" y="-4" width="26" height="12" rx="3" fill="#ffffff" stroke="#f43f5e" stroke-width="1.5"/>
          <!-- Nến sinh nhật lung linh -->
          <rect x="25" y="-12" width="5" height="8" fill="#38bdf8"/>
          <ellipse cx="27" cy="-14" rx="2.5" ry="3.5" fill="#f59e0b"/>
          <rect x="73" y="-12" width="5" height="8" fill="#f472b6"/>
          <ellipse cx="75" cy="-14" rx="2.5" ry="3.5" fill="#f59e0b"/>
        </g>
        <!-- Tóc đen bồng bềnh -->
        <path d="M 60 70 C 58 28 75 14 100 14 C 125 14 142 28 140 70 C 130 48 115 40 100 40 C 85 40 70 48 60 70 Z" fill="#18181b"/>
        <!-- 2 tay giơ lên chạm gọng kính nhí nhảnh -->
        <ellipse cx="50" cy="85" rx="8" ry="10" fill="url(#skin3)"/>
        <ellipse cx="150" cy="85" rx="8" ry="10" fill="url(#skin3)"/>
      </svg>
    `),
  },
  {
    id: 'idol-photostar-4-mic',
    name: 'Idol Nam 4 (Cầm Mic - Peace Sign ✌️)',
    category: 'celebrity',
    defaultWidth: 240,
    defaultHeight: 320,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
        <defs>
          <linearGradient id="skin4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff0ea"/>
            <stop offset="100%" stop-color="#fcd5ce"/>
          </linearGradient>
          <pattern id="pinkPlaid4" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#f8d7da"/>
            <rect width="8" height="16" fill="#f1aeb5" opacity="0.6"/>
            <rect width="16" height="8" fill="#ea868f" opacity="0.4"/>
          </pattern>
        </defs>
        <!-- Áo sơ mi caro hồng phong cách idol biểu diễn -->
        <path d="M 45 130 Q 100 145 155 130 L 165 280 L 35 280 Z" fill="url(#pinkPlaid4)"/>
        <polygon points="85,135 115,135 110,180 90,180" fill="#ffffff"/>
        <!-- Cổ & Khuôn mặt -->
        <rect x="85" y="115" width="30" height="25" rx="5" fill="url(#skin4)"/>
        <path d="M 65 70 C 65 115 80 128 100 128 C 120 128 135 115 135 70 C 135 35 65 35 65 70 Z" fill="url(#skin4)"/>
        <ellipse cx="78" cy="98" rx="8" ry="5" fill="#ff758f" opacity="0.6"/>
        <ellipse cx="122" cy="98" rx="8" ry="5" fill="#ff758f" opacity="0.6"/>
        <!-- Nháy mắt tinh nghịch (Wink 😉) -->
        <path d="M 74 82 Q 82 88 90 82" stroke="#212529" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="117" cy="81" rx="4.5" ry="5.5" fill="#212529"/>
        <circle cx="118" cy="79" r="1.5" fill="#ffffff"/>
        <path d="M 90 106 Q 100 118 110 106" stroke="#e11d48" stroke-width="3" fill="#ffffff"/>
        <!-- Tóc vuốt nếp đen phong độ -->
        <path d="M 60 70 C 58 28 75 14 100 14 C 125 14 142 28 140 70 C 130 48 115 40 100 40 C 85 40 70 48 60 70 Z" fill="#18181b"/>
        <!-- Tay phải giơ chữ V (Peace Sign ✌️) cạnh mặt -->
        <g transform="translate(136, 68) rotate(15)">
          <rect x="0" y="0" width="18" height="24" rx="8" fill="url(#skin4)"/>
          <!-- 2 ngón tay giơ chữ V -->
          <rect x="0" y="-22" width="7" height="25" rx="3.5" fill="url(#skin4)"/>
          <rect x="11" y="-20" width="7" height="25" rx="3.5" fill="url(#skin4)"/>
        </g>
        <!-- Tay trái cầm Micro ca sĩ trước ngực -->
        <g transform="translate(90, 120)">
          <!-- Bàn tay nắm -->
          <ellipse cx="10" cy="35" rx="12" ry="10" fill="url(#skin4)"/>
          <!-- Đầu củ micro xám bạc có lưới -->
          <ellipse cx="10" cy="5" rx="9" ry="12" fill="#64748b" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="4" y1="5" x2="16" y2="5" stroke="#94a3b8" stroke-width="1"/>
          <!-- Thân micro màu đen -->
          <rect x="6" y="16" width="8" height="42" rx="2" fill="#0f172a"/>
        </g>
      </svg>
    `),
  },

  {
    id: 'idol-heart-pose',
    name: 'Idol Finger Heart (K-Heart 🫰)',
    category: 'celebrity',
    defaultWidth: 260,
    defaultHeight: 340,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">
        <defs>
          <linearGradient id="idolGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a18cd1"/>
            <stop offset="100%" stop-color="#fbc2eb"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="45" fill="#ffe0d6"/>
        <path d="M 52 65 C 50 20, 150 20, 148 65 C 135 40, 110 38, 100 38 C 90 38, 65 40, 52 65 Z" fill="#4a3e3d"/>
        <path d="M 80 72 Q 86 66 92 72" stroke="#2d3436" stroke-width="2.5" fill="none"/>
        <ellipse cx="115" cy="72" rx="4" ry="5" fill="#2d3436"/>
        <circle cx="116" cy="70" r="1.5" fill="#ffffff"/>
        <circle cx="75" cy="80" r="6" fill="#ff7675" opacity="0.6"/>
        <circle cx="125" cy="80" r="6" fill="#ff7675" opacity="0.6"/>
        <path d="M 94 84 Q 100 90 106 84" stroke="#2d3436" stroke-width="2" fill="none"/>
        <path d="M 68 120 L 132 120 L 145 240 L 55 240 Z" fill="url(#idolGrad2)"/>
        <g transform="translate(130, 80)">
          <circle cx="15" cy="18" r="12" fill="#ffe0d6"/>
          <path d="M 15 2 C 15 -4, 9 -4, 9 2 C 9 7, 15 12, 15 12 C 15 12, 21 7, 21 2 C 21 -4, 15 -4, 15 2 Z" fill="#ff3366"/>
        </g>
      </svg>
    `),
  },

  // 🐰 3. NHÂN VẬT & MASCOT DỄ THƯƠNG
  {
    id: 'cute-bunny-mascot',
    name: 'Thỏ Trắng Cute Bunny',
    category: 'character',
    defaultWidth: 200,
    defaultHeight: 250,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="160" height="200">
        <ellipse cx="60" cy="50" rx="14" ry="40" fill="#ffffff" stroke="#ffccd5" stroke-width="3"/>
        <ellipse cx="60" cy="50" rx="7" ry="26" fill="#ffb3c1"/>
        <ellipse cx="100" cy="50" rx="14" ry="40" fill="#ffffff" stroke="#ffccd5" stroke-width="3"/>
        <ellipse cx="100" cy="50" rx="7" ry="26" fill="#ffb3c1"/>
        <circle cx="80" cy="110" r="45" fill="#ffffff" stroke="#ffccd5" stroke-width="3"/>
        <circle cx="68" cy="106" r="4" fill="#2d3436"/>
        <circle cx="92" cy="106" r="4" fill="#2d3436"/>
        <circle cx="69" cy="104" r="1.5" fill="#ffffff"/>
        <circle cx="93" cy="104" r="1.5" fill="#ffffff"/>
        <ellipse cx="80" cy="115" rx="3.5" ry="2.5" fill="#ff758c"/>
        <circle cx="58" cy="116" r="5" fill="#ff80bf" opacity="0.4"/>
        <circle cx="102" cy="116" r="5" fill="#ff80bf" opacity="0.4"/>
      </svg>
    `),
  },

  // ✨ 4. Y2K & AESTHETIC
  {
    id: 'y2k-starburst-4p',
    name: 'Ngôi Sao 4 Cánh Y2K Starburst',
    category: 'y2k',
    defaultWidth: 100,
    defaultHeight: 100,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff758c"/>
            <stop offset="100%" stop-color="#70a6ff"/>
          </linearGradient>
        </defs>
        <path d="M 50 0 Q 52 48 100 50 Q 52 52 50 100 Q 48 52 0 50 Q 48 48 50 0 Z" fill="url(#starGrad)"/>
        <circle cx="50" cy="50" r="4" fill="#ffffff"/>
      </svg>
    `),
  },
  {
    id: 'y2k-butterfly-holo',
    name: 'Bướm Hologram Cyber Y2K',
    category: 'y2k',
    defaultWidth: 140,
    defaultHeight: 110,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110" width="140" height="110">
        <defs>
          <linearGradient id="bfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b5179e"/>
            <stop offset="50%" stop-color="#4cc9f0"/>
            <stop offset="100%" stop-color="#f72585"/>
          </linearGradient>
        </defs>
        <path d="M 70 55 C 50 10 0 20 20 60 C 0 80 30 100 70 65 C 110 100 140 80 120 60 C 140 20 90 10 70 55 Z" fill="url(#bfGrad)" opacity="0.9"/>
        <ellipse cx="70" cy="58" rx="3" ry="16" fill="#2d3436"/>
      </svg>
    `),
  },
  {
    id: 'y2k-barcode-sticker',
    name: 'Tem Mã Vạch Y2K Aesthetic Barcode',
    category: 'y2k',
    defaultWidth: 180,
    defaultHeight: 70,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 70" width="180" height="70">
        <rect width="180" height="70" fill="#ffffff" rx="8" stroke="#111" stroke-width="2"/>
        <g fill="#111">
          <rect x="15" y="10" width="3" height="35"/>
          <rect x="22" y="10" width="6" height="35"/>
          <rect x="32" y="10" width="2" height="35"/>
          <rect x="38" y="10" width="8" height="35"/>
          <rect x="50" y="10" width="4" height="35"/>
          <rect x="58" y="10" width="2" height="35"/>
          <rect x="64" y="10" width="7" height="35"/>
          <rect x="75" y="10" width="3" height="35"/>
          <rect x="82" y="10" width="6" height="35"/>
          <rect x="92" y="10" width="4" height="35"/>
          <rect x="100" y="10" width="2" height="35"/>
          <rect x="106" y="10" width="8" height="35"/>
          <rect x="118" y="10" width="3" height="35"/>
          <rect x="125" y="10" width="7" height="35"/>
          <rect x="136" y="10" width="4" height="35"/>
          <rect x="144" y="10" width="2" height="35"/>
          <rect x="150" y="10" width="5" height="35"/>
          <rect x="160" y="10" width="4" height="35"/>
        </g>
        <text x="90" y="58" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#111">PHOTOBOOTH '24</text>
      </svg>
    `),
  },

  // 🎞️ 5. VINTAGE & RETRO PHOTOBOOTH
  {
    id: 'vintage-date-stamp',
    name: 'Tem Ngày Máy Phim Retro Cam',
    category: 'vintage',
    defaultWidth: 150,
    defaultHeight: 40,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 40" width="150" height="40">
        <text x="75" y="28" text-anchor="middle" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#ff6b35" letter-spacing="3">'24 10 14</text>
      </svg>
    `),
  },
  {
    id: 'vintage-polaroid-camera',
    name: 'Máy Ảnh Film Polaroid',
    category: 'vintage',
    defaultWidth: 140,
    defaultHeight: 120,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120" width="140" height="120">
        <rect x="15" y="20" width="110" height="90" rx="14" fill="#ffffff" stroke="#2d3436" stroke-width="4"/>
        <rect x="25" y="30" width="90" height="50" rx="6" fill="#f1f2f6"/>
        <circle cx="70" cy="55" r="20" fill="#2d3436"/>
        <circle cx="70" cy="55" r="14" fill="#0984e3"/>
        <circle cx="66" cy="51" r="4" fill="#ffffff"/>
        <!-- Polaroid rainbow stripes -->
        <rect x="25" y="85" width="22" height="8" fill="#e74c3c"/>
        <rect x="47" y="85" width="22" height="8" fill="#f39c12"/>
        <rect x="69" y="85" width="22" height="8" fill="#2ecc71"/>
        <rect x="91" y="85" width="24" height="8" fill="#3498db"/>
        <circle cx="105" cy="38" r="5" fill="#e74c3c"/>
      </svg>
    `),
  },

  // 🌸 6. CUTE DOODLES & RUY BĂNG
  {
    id: 'cute-ribbon-red',
    name: 'Nơ Ruy Băng Lụa Đỏ',
    category: 'cute',
    defaultWidth: 130,
    defaultHeight: 90,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="130" height="90">
        <defs>
          <linearGradient id="bowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff4d6d"/>
            <stop offset="100%" stop-color="#c9184a"/>
          </linearGradient>
        </defs>
        <path d="M 65 35 C 45 10 10 15 15 45 C 20 65 50 45 65 38 Z" fill="url(#bowGrad)"/>
        <path d="M 65 35 C 85 10 120 15 115 45 C 110 65 80 45 65 38 Z" fill="url(#bowGrad)"/>
        <path d="M 60 40 Q 40 70 30 85 Q 50 80 62 48 Z" fill="url(#bowGrad)"/>
        <path d="M 70 40 Q 90 70 100 85 Q 80 80 68 48 Z" fill="url(#bowGrad)"/>
        <ellipse cx="65" cy="38" rx="9" ry="8" fill="#a4133c"/>
      </svg>
    `),
  },
  {
    id: 'cute-daisy-flower',
    name: 'Hoa Cúc Hoạ Mi Daisy',
    category: 'cute',
    defaultWidth: 90,
    defaultHeight: 90,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="90" height="90">
        <g transform="translate(45, 45)">
          ${Array.from({ length: 8 }, (_, i) => `
            <ellipse cx="0" cy="-28" rx="8" ry="16" fill="#ffffff" stroke="#e0e0e0" stroke-width="1.5" transform="rotate(${i * 45})"/>
          `).join('')}
          <circle cx="0" cy="0" r="14" fill="#ffd166"/>
        </g>
      </svg>
    `),
  },

  // 🎂 7. SINH NHẬT & TIỆC TÙNG (PARTY)
  {
    id: 'bday-cake',
    name: 'Bánh Kem Sinh Nhật Nến',
    category: 'birthday',
    defaultWidth: 140,
    defaultHeight: 140,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="140" height="140">
        <!-- Đĩa bánh -->
        <ellipse cx="70" cy="120" rx="60" ry="12" fill="#dfe6e9"/>
        <!-- Thân bánh -->
        <rect x="25" y="70" width="90" height="45" rx="6" fill="#ffb6c1"/>
        <!-- Kem chảy -->
        <path d="M 25 70 Q 35 85 45 70 Q 55 85 65 70 Q 75 85 85 70 Q 95 85 105 70 Q 115 85 115 70 L 115 65 L 25 65 Z" fill="#ffffff"/>
        <!-- 3 Cây nến -->
        <rect x="42" y="45" width="6" height="20" fill="#74b9ff"/>
        <rect x="67" y="40" width="6" height="25" fill="#ffeaa7"/>
        <rect x="92" y="45" width="6" height="20" fill="#ff7675"/>
        <!-- Ngọn lửa nến -->
        <circle cx="45" cy="38" r="4" fill="#ff9f43"/>
        <circle cx="70" cy="33" r="5" fill="#ff9f43"/>
        <circle cx="95" cy="38" r="4" fill="#ff9f43"/>
      </svg>
    `),
  },
  {
    id: 'bday-confetti-popper',
    name: 'Pháo Giấy Confetti Bùng Nổ',
    category: 'birthday',
    defaultWidth: 150,
    defaultHeight: 130,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 130" width="150" height="130">
        <!-- Ống pháo -->
        <polygon points="20,110 50,80 35,65 5,95" fill="#6c5ce7"/>
        <!-- Mảnh kim tuyến bay -->
        <circle cx="70" cy="50" r="5" fill="#ff7675"/>
        <circle cx="95" cy="30" r="4" fill="#fdcb6e"/>
        <circle cx="120" cy="65" r="5" fill="#00b894"/>
        <circle cx="60" cy="20" r="3" fill="#e84393"/>
        <rect x="80" y="60" width="6" height="12" rx="2" fill="#0984e3" transform="rotate(25 80 60)"/>
        <rect x="110" y="40" width="6" height="12" rx="2" fill="#e17055" transform="rotate(-35 110 40)"/>
        <rect x="85" y="20" width="5" height="10" rx="2" fill="#fd79a8" transform="rotate(45 85 20)"/>
      </svg>
    `),
  },

  // ⭐ 8. ICON VECTOR CƠ BẢN
  {
    id: 'icon-crown-gold',
    name: 'Vương Miện Hoàng Gia',
    category: 'icon',
    defaultWidth: 110,
    defaultHeight: 80,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80" width="110" height="80">
        <polygon points="10,65 20,20 45,45 55,10 65,45 90,20 100,65" fill="#f1c40f" stroke="#d68910" stroke-width="3"/>
        <circle cx="20" cy="18" r="4" fill="#e74c3c"/>
        <circle cx="55" cy="8" r="5" fill="#3498db"/>
        <circle cx="90" cy="18" r="4" fill="#e74c3c"/>
      </svg>
    `),
  },
  {
    id: 'icon-fire-flame',
    name: 'Ngọn Lửa Hot Flame',
    category: 'icon',
    defaultWidth: 90,
    defaultHeight: 110,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 110" width="90" height="110">
        <path d="M 45 10 C 55 35 75 45 75 70 C 75 90 60 105 45 105 C 30 105 15 90 15 70 C 15 50 35 35 45 10 Z" fill="#ff7675"/>
        <path d="M 45 45 C 52 58 60 68 60 80 C 60 90 52 98 45 98 C 38 98 30 90 30 80 C 30 68 38 58 45 45 Z" fill="#ffeaa7"/>
      </svg>
    `),
  },

  // 🎬 9. STICKER ĐỘNG / GIF ANIMATED (SVG HOẠT HÌNH)
  {
    id: 'gif-bling-sparkles',
    name: 'Bling Bling Lấp Lánh (Animated ✨)',
    category: 'gif',
    isGif: true,
    defaultWidth: 120,
    defaultHeight: 120,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Chùm sao hoạt hình tự phát sáng nhấp nháy -->
        <g transform="translate(60, 60)">
          <path d="M 0 -45 Q 5 -5 45 0 Q 5 5 0 45 Q -5 5 -45 0 Q -5 -5 0 -45 Z" fill="#ffd166">
            <animateTransform attributeName="transform" type="scale" values="0.7;1.2;0.7" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite"/>
          </path>
        </g>
        <g transform="translate(25, 30)">
          <path d="M 0 -18 Q 2 -2 18 0 Q 2 2 0 18 Q -2 2 -18 0 Q -2 -2 0 -18 Z" fill="#ffffff">
            <animateTransform attributeName="transform" type="scale" values="1.2;0.5;1.2" dur="0.9s" repeatCount="indefinite"/>
          </path>
        </g>
        <g transform="translate(95, 85)">
          <path d="M 0 -22 Q 3 -3 22 0 Q 3 3 0 22 Q -3 3 -22 0 Q -3 -3 0 -22 Z" fill="#ff758c">
            <animateTransform attributeName="transform" type="scale" values="0.6;1.3;0.6" dur="1s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    `),
  },
  {
    id: 'gif-pulsing-heart',
    name: 'Trái Tim Đập Nhịp Neon (Animated 💖)',
    category: 'gif',
    isGif: true,
    defaultWidth: 100,
    defaultHeight: 100,
    src: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <g transform="translate(50, 50)">
          <path d="M 0 -15 C -5 -30 -30 -30 -30 -10 C -30 10 0 35 0 35 C 0 35 30 10 30 -10 C 30 -30 5 -30 0 -15 Z" fill="#ff2a7a">
            <animateTransform attributeName="transform" type="scale" values="1;1.25;1;1.35;1" keyTimes="0;0.2;0.4;0.6;1" dur="1s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    `),
  },
];

// ==========================================
// 2.5 BỘ IDOL GHÉP KHUNG PHOTO STAR (K-POP)
// ==========================================
export interface IdolPreset {
  id: string;
  name: string;
  src: string;
  defaultPosition: 'left' | 'right';
  description: string;
  badge?: string;
  flipX?: boolean;
  width: number;
  height: number;
}

export const IDOL_PHOTO_STAR_PRESETS: IdolPreset[] = [
  {
    id: 'idol-photostar-1',
    name: 'Idol Chỉ Má (Caro hồng)',
    src: '/idols/idol_1.png',
    defaultPosition: 'left',
    description: 'Tạo dáng dễ thương hai tay chỉ má, áo sơ mi caro hồng',
    badge: 'Ô #1 (Trái)',
    flipX: false,
    width: 158,
    height: 143,
  },
  {
    id: 'idol-photostar-2',
    name: 'Idol Selfie (Áo Austin)',
    src: '/idols/idol_2.png',
    defaultPosition: 'right',
    description: 'Tạo dáng chu môi chụp selfie điện thoại, áo sát nách Austin 3:16',
    badge: 'Ô #2 (Phải)',
    flipX: false,
    width: 159,
    height: 143,
  },
  {
    id: 'idol-photostar-3',
    name: 'Idol Kính Nến Bánh Kem',
    src: '/idols/idol_3.png',
    defaultPosition: 'left',
    description: 'Đeo kính nến sinh nhật tiệc tùng, giữ gọng kính phong cách',
    badge: 'Ô #3 (Trái)',
    flipX: false,
    width: 158,
    height: 143,
  },
  {
    id: 'idol-photostar-4',
    name: 'Idol Cầm Mic Giơ V',
    src: '/idols/idol_4.png',
    defaultPosition: 'right',
    description: 'Một tay cầm micro biểu diễn, một tay giơ chữ V nháy mắt',
    badge: 'Ô #4 (Phải)',
    flipX: false,
    width: 159,
    height: 143,
  },
];

// ==========================================
// 3. MẪU DỰNG SẴN ĐẲNG CẤP (TEMPLATES)
// ==========================================
export const PRESET_TEMPLATES: FrameTemplate[] = [
  // ⭐ MẪU CHUẨN XÁC THEO HÌNH USER: PHOTO STAR (4 Ô IDOL GHÉP VÀO KHUNG)
  {
    id: 'photo-star-kpop-strip',
    name: 'Photo Star Idol K-pop (Strip 1x4)',
    category: 'cute',
    description: 'Mẫu Photostrip 4 ảnh dọc ghép sẵn 4 pose idol thần tượng K-pop (Photo Star) kèm nơ, bánh kem và thỏ hồng chuẩn như ảnh mẫu.',
    preview: '#ffeef5',
    doc: {
      canvas: {
        width: 258,
        height: 775,
        background: {
          type: 'solid',
          color: '#fff0f5',
        },
      },
      objects: [
        // Slot 1
        {
          id: 'slot_1',
          type: 'slot',
          name: 'Ô ảnh #1',
          x: 18,
          y: 26,
          width: 222,
          height: 142,
          rotation: 0,
          opacity: 1,
          cornerRadius: 16,
          stroke: '#f8bbd0',
          strokeWidth: 2,
        },
        // Slot 2
        {
          id: 'slot_2',
          type: 'slot',
          name: 'Ô ảnh #2',
          x: 18,
          y: 196,
          width: 222,
          height: 142,
          rotation: 0,
          opacity: 1,
          cornerRadius: 16,
          stroke: '#f8bbd0',
          strokeWidth: 2,
        },
        // Slot 3
        {
          id: 'slot_3',
          type: 'slot',
          name: 'Ô ảnh #3',
          x: 18,
          y: 366,
          width: 222,
          height: 142,
          rotation: 0,
          opacity: 1,
          cornerRadius: 16,
          stroke: '#f8bbd0',
          strokeWidth: 2,
        },
        // Slot 4
        {
          id: 'slot_4',
          type: 'slot',
          name: 'Ô ảnh #4',
          x: 18,
          y: 536,
          width: 222,
          height: 142,
          rotation: 0,
          opacity: 1,
          cornerRadius: 16,
          stroke: '#f8bbd0',
          strokeWidth: 2,
        },
        // Idol 1 (Bên trái Ô 1)
        {
          id: 'idol_obj_1',
          type: 'image',
          name: 'Idol Chỉ Má (Ô #1)',
          src: '/idols/idol_1.png',
          x: 18,
          y: 26,
          width: 120,
          height: 142,
          rotation: 0,
          opacity: 1,
          flipX: false,
          slotId: 'slot_1',
          clipToSlot: true,
          positionInSlot: 'left',
        },
        // Idol 2 (Bên phải Ô 2)
        {
          id: 'idol_obj_2',
          type: 'image',
          name: 'Idol Selfie (Ô #2)',
          src: '/idols/idol_2.png',
          x: 120,
          y: 196,
          width: 120,
          height: 142,
          rotation: 0,
          opacity: 1,
          flipX: false,
          slotId: 'slot_2',
          clipToSlot: true,
          positionInSlot: 'right',
        },
        // Idol 3 (Bên trái Ô 3)
        {
          id: 'idol_obj_3',
          type: 'image',
          name: 'Idol Kính Bánh Kem (Ô #3)',
          src: '/idols/idol_3.png',
          x: 18,
          y: 366,
          width: 120,
          height: 142,
          rotation: 0,
          opacity: 1,
          flipX: false,
          slotId: 'slot_3',
          clipToSlot: true,
          positionInSlot: 'left',
        },
        // Idol 4 (Bên phải Ô 4)
        {
          id: 'idol_obj_4',
          type: 'image',
          name: 'Idol Cầm Mic Giơ V (Ô #4)',
          src: '/idols/idol_4.png',
          x: 120,
          y: 536,
          width: 120,
          height: 142,
          rotation: 0,
          opacity: 1,
          flipX: false,
          slotId: 'slot_4',
          clipToSlot: true,
          positionInSlot: 'right',
        },
        // Text "xoxo" trên góc Ô #2
        {
          id: 'txt_xoxo',
          type: 'text',
          name: 'Chữ xoxo',
          text: 'xoxo',
          fontFamily: 'Montserrat',
          fontSize: 10,
          fontStyle: 'bold',
          fill: '#ec4899',
          stroke: '#ffffff',
          strokeWidth: 1,
          align: 'center',
          x: 200,
          y: 178,
          width: 40,
          height: 16,
          rotation: 0,
          opacity: 0.9,
          shadowColor: '#fbcfe8',
          shadowBlur: 2,
        },
        // Text "PHOTO STAR" ở góc dưới
        {
          id: 'txt_photostar',
          type: 'text',
          name: 'Logo PHOTO STAR',
          text: 'PHOTO STAR',
          fontFamily: 'Montserrat',
          fontSize: 15,
          fontStyle: 'bold',
          fill: '#db2777',
          stroke: '#ffffff',
          strokeWidth: 2,
          align: 'left',
          x: 18,
          y: 725,
          width: 140,
          height: 24,
          rotation: 0,
          opacity: 1,
          shadowColor: '#fbcfe8',
          shadowBlur: 3,
        },
      ],
    },
  },
  // 🇻🇳 MẪU CHUẨN XÁC THEO HÌNH CỦA KHÁCH: QUÂN ĐỘI / KỶ NIỆM 1944.12.22
  {
    id: 'vietnam-heritage-1944',
    name: 'Kỷ Niệm Quân Đội 1944 (Photo Object)',
    category: 'vietnam',
    description: '3 ô ảnh bo góc viền kem, nền rêu camo lá, dải cờ đỏ sao vàng treo ngang, ruy băng góc và tem xe tăng lịch sử.',
    preview: '#284325',
    doc: {
      canvas: {
        width: 600,
        height: 1800,
        background: {
          type: 'image',
          src: PRESET_BACKGROUNDS[0].src,
          fit: 'cover',
          opacity: 1,
        },
      },
      objects: [
        // 3 Slots bo góc và có viền kem thanh lịch
        {
          id: 'slot_1',
          type: 'slot',
          name: 'Ô ảnh 1',
          x: 55,
          y: 130,
          width: 490,
          height: 460,
          rotation: 0,
          opacity: 1,
          cornerRadius: 24,
          stroke: '#ece8d4',
          strokeWidth: 6,
        },
        {
          id: 'slot_2',
          type: 'slot',
          name: 'Ô ảnh 2',
          x: 55,
          y: 660,
          width: 490,
          height: 460,
          rotation: 0,
          opacity: 1,
          cornerRadius: 24,
          stroke: '#ece8d4',
          strokeWidth: 6,
        },
        {
          id: 'slot_3',
          type: 'slot',
          name: 'Ô ảnh 3',
          x: 55,
          y: 1190,
          width: 490,
          height: 460,
          rotation: 0,
          opacity: 1,
          cornerRadius: 24,
          stroke: '#ece8d4',
          strokeWidth: 6,
        },
        // Header Text: "PHOTO OBJECT"
        {
          id: 'obj_photo_object',
          type: 'image',
          name: 'Banner Photo Object',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-photo-object-badge')!.src,
          x: 170,
          y: 45,
          width: 260,
          height: 50,
          rotation: 0,
          opacity: 1,
        },
        // Top left: "2024 VIVID SEASON" badge
        {
          id: 'obj_vivid_badge',
          type: 'image',
          name: 'Huy hiệu Vivid Season',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-vivid-season-badge')!.src,
          x: 15,
          y: 35,
          width: 125,
          height: 65,
          rotation: -4,
          opacity: 1,
        },
        // Dải cờ đỏ sao vàng treo vắt ngang giữa slot 1 và slot 2
        {
          id: 'obj_bunting_flags',
          type: 'image',
          name: 'Dây cờ đỏ sao vàng',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-bunting-flags')!.src,
          x: 40,
          y: 605,
          width: 520,
          height: 75,
          rotation: 0,
          opacity: 1,
        },
        // Tem Xe Tăng 1944.12.22 ở góc dưới trái
        {
          id: 'obj_tank_stamp',
          type: 'image',
          name: 'Tem xe tăng 1944.12.22',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-tank-stamp')!.src,
          x: 35,
          y: 1675,
          width: 195,
          height: 85,
          rotation: -2,
          opacity: 1,
        },
        // Ruy băng cờ đỏ sao vàng ở góc dưới phải
        {
          id: 'obj_corner_ribbon',
          type: 'image',
          name: 'Ruy băng góc',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-corner-ribbon')!.src,
          x: 360,
          y: 1680,
          width: 220,
          height: 95,
          rotation: 0,
          opacity: 1,
        },
        // Sparkles đỏ viền vàng ở góc trên slot 1
        {
          id: 'obj_sparkle_1',
          type: 'image',
          name: 'Sparkle góc trên',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-sparkle-red-gold')!.src,
          x: 460,
          y: 165,
          width: 55,
          height: 55,
          rotation: 12,
          opacity: 0.9,
        },
        // Sparkles ở góc slot 3
        {
          id: 'obj_sparkle_2',
          type: 'image',
          name: 'Sparkle góc dưới',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vn-sparkle-red-gold')!.src,
          x: 80,
          y: 1220,
          width: 50,
          height: 50,
          rotation: -8,
          opacity: 0.9,
        },
      ],
    },
  },

  // 🌸 MẪU 2: Y2K CYBER PINK 4-CUT
  {
    id: 'y2k-cyber-pink-template',
    name: 'Y2K Cyber Pink (4 Ô Ảnh)',
    category: 'y2k',
    description: 'Phong cách Hàn Quốc Y2K ngọt ngào với lưới hồng cyber, bướm hologram và mã vạch aesthetic.',
    preview: '#ff758c',
    doc: {
      canvas: {
        width: 600,
        height: 1800,
        background: {
          type: 'image',
          src: PRESET_BACKGROUNDS[1].src,
          fit: 'cover',
          opacity: 1,
        },
      },
      objects: [
        {
          id: 'slot_1',
          type: 'slot',
          x: 60,
          y: 120,
          width: 480,
          height: 350,
          rotation: 0,
          opacity: 1,
          cornerRadius: 18,
          stroke: '#ffffff',
          strokeWidth: 4,
        },
        {
          id: 'slot_2',
          type: 'slot',
          x: 60,
          y: 500,
          width: 480,
          height: 350,
          rotation: 0,
          opacity: 1,
          cornerRadius: 18,
          stroke: '#ffffff',
          strokeWidth: 4,
        },
        {
          id: 'slot_3',
          type: 'slot',
          x: 60,
          y: 880,
          width: 480,
          height: 350,
          rotation: 0,
          opacity: 1,
          cornerRadius: 18,
          stroke: '#ffffff',
          strokeWidth: 4,
        },
        {
          id: 'slot_4',
          type: 'slot',
          x: 60,
          y: 1260,
          width: 480,
          height: 350,
          rotation: 0,
          opacity: 1,
          cornerRadius: 18,
          stroke: '#ffffff',
          strokeWidth: 4,
        },
        {
          id: 'y2k_bf',
          type: 'image',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'y2k-butterfly-holo')!.src,
          x: 430,
          y: 60,
          width: 120,
          height: 95,
          rotation: 15,
          opacity: 1,
        },
        {
          id: 'y2k_bc',
          type: 'image',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'y2k-barcode-sticker')!.src,
          x: 210,
          y: 1670,
          width: 180,
          height: 70,
          rotation: 0,
          opacity: 1,
        },
      ],
    },
  },

  // 🎞️ MẪU 3: KOREAN VINTAGE FILM 3-CUT
  {
    id: 'korean-vintage-film-template',
    name: 'Vintage Film Strip (3 Ô Ảnh)',
    category: 'vintage',
    description: 'Phong cách máy phim cổ điển, lỗ film sprockets hai bên, date stamp cam retro.',
    preview: '#232526',
    doc: {
      canvas: {
        width: 600,
        height: 1800,
        background: {
          type: 'image',
          src: PRESET_BACKGROUNDS[3].src,
          fit: 'cover',
          opacity: 1,
        },
      },
      objects: [
        {
          id: 'slot_1',
          type: 'slot',
          x: 55,
          y: 120,
          width: 490,
          height: 480,
          rotation: 0,
          opacity: 1,
          cornerRadius: 12,
          stroke: '#e0e0e0',
          strokeWidth: 4,
        },
        {
          id: 'slot_2',
          type: 'slot',
          x: 55,
          y: 640,
          width: 490,
          height: 480,
          rotation: 0,
          opacity: 1,
          cornerRadius: 12,
          stroke: '#e0e0e0',
          strokeWidth: 4,
        },
        {
          id: 'slot_3',
          type: 'slot',
          x: 55,
          y: 1160,
          width: 490,
          height: 480,
          rotation: 0,
          opacity: 1,
          cornerRadius: 12,
          stroke: '#e0e0e0',
          strokeWidth: 4,
        },
        {
          id: 'v_stamp',
          type: 'image',
          src: PRESET_CHARACTERS_AND_STICKERS.find((s) => s.id === 'vintage-date-stamp')!.src,
          x: 220,
          y: 1680,
          width: 160,
          height: 45,
          rotation: 0,
          opacity: 1,
        },
      ],
    },
  },
];
