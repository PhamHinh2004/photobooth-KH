import frameOptionsData from '@/data/frame_options.json';
import type { PackageOption } from '@/types/capture.types';

export interface GroupFrameLayout extends PackageOption {
  rows: number[];
}

const soloOptions = frameOptionsData as PackageOption[];
const soloOptionsById = new Map(soloOptions.map((option) => [option.id, option]));

function createLayout(id: string, rows: number[], customTitle?: string): GroupFrameLayout {
  const soloOption = soloOptionsById.get(id);
  const slotsCount = rows.reduce((total, count) => total + count, 0);

  return {
    id,
    title: customTitle ?? soloOption?.title ?? `Grid ${id} (${slotsCount} Slot)`,
    subtitle: soloOption?.subtitle ?? `Bố cục trơn ${slotsCount} ô cho chụp nhóm`,
    slotsCount,
    shotsCount: slotsCount,
    dimensions: soloOption?.dimensions ?? '10x15 cm',
    icon: soloOption?.icon ?? '▦',
    category: soloOption?.category ?? 'grid',
    rows,
  };
}

const layoutsByGroupSize: Record<number, GroupFrameLayout[]> = {
  2: [createLayout('2x2', [2, 2]), createLayout('1x4', [1, 1, 1, 1]), createLayout('2x3', [2, 2, 2])],
  3: [createLayout('3x3', [3, 3, 3], 'Grid 3×3 (9 Slot)')],
  4: [createLayout('2x2', [2, 2]), createLayout('1x4', [1, 1, 1, 1]), createLayout('4x2', [4, 4])],
  5: [
    createLayout('5_3_2', [3, 2], 'Frame trơn 5 ô · 3 trên, 2 dưới'),
    createLayout('5_2_3', [2, 3], 'Frame trơn 5 ô · 2 trên, 3 dưới'),
  ],
  6: [createLayout('3x2', [3, 3])],
  7: [
    createLayout('7_4_3', [4, 3], 'Frame trơn 7 ô · 4 trên, 3 dưới'),
    createLayout('7_3_4', [3, 4], 'Frame trơn 7 ô · 3 trên, 4 dưới'),
  ],
  8: [createLayout('4x2', [4, 4])],
};

export function getGroupFrameLayouts(groupSize: number): GroupFrameLayout[] {
  return layoutsByGroupSize[groupSize] ?? [];
}