/**
 * Moment Layout Engine
 * Calculates grid structures, CSS classes, and presentation attributes
 * for the 6 core moment presentation layouts.
 * Specification Sections: 14, 15, 18, 19
 */

import type { MomentLayoutType, MomentPresentationSettings } from '@/types';

export interface LayoutConfig {
  id: MomentLayoutType;
  label: string;
  description: string;
  containerClassName: string;
  getItemClassName: (index: number, total: number) => string;
}

export const MOMENT_LAYOUTS: Record<MomentLayoutType, LayoutConfig> = {
  'single-hero': {
    id: 'single-hero',
    label: 'Single Hero',
    description: 'A prominent focal hero image or video followed by secondary media.',
    containerClassName: 'flex flex-col gap-6',
    getItemClassName: (index: number) =>
      index === 0
        ? 'w-full aspect-[4/3] sm:aspect-[16/9] rounded-3xl shadow-lg overflow-hidden'
        : 'w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden',
  },
  'two-up': {
    id: 'two-up',
    label: 'Two-Up',
    description: 'Clean balanced side-by-side split layout.',
    containerClassName: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
    getItemClassName: () => 'w-full aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden',
  },
  'three-grid': {
    id: 'three-grid',
    label: 'Three-Grid',
    description: 'Balanced symmetrical trio gallery format.',
    containerClassName: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
    getItemClassName: () => 'w-full aspect-square rounded-2xl overflow-hidden',
  },
  'film-strip': {
    id: 'film-strip',
    label: 'Film Strip',
    description: 'Horizontal cinematic scrolling carousel reminiscent of negative film.',
    containerClassName: 'flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory',
    getItemClassName: () => 'shrink-0 w-[85vw] sm:w-[420px] aspect-[16/10] snap-center rounded-2xl overflow-hidden shadow-md',
  },
  'portrait-feature': {
    id: 'portrait-feature',
    label: 'Portrait Feature',
    description: 'Vertical 9:16 portrait focus honoring mobile captures.',
    containerClassName: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
    getItemClassName: (index: number) =>
      index === 0
        ? 'sm:col-span-2 lg:col-span-1 aspect-[9/16] rounded-3xl overflow-hidden shadow-md'
        : 'aspect-[9/16] rounded-2xl overflow-hidden',
  },
  'mixed-collage': {
    id: 'mixed-collage',
    label: 'Mixed Collage',
    description: 'Artistic asymmetrical masonry collage with varying aspect ratios.',
    containerClassName: 'grid grid-cols-1 sm:grid-cols-12 gap-4',
    getItemClassName: (index: number) => {
      const pattern = index % 5;
      switch (pattern) {
        case 0:
          return 'sm:col-span-8 aspect-[16/10] rounded-3xl overflow-hidden';
        case 1:
          return 'sm:col-span-4 aspect-[4/5] rounded-2xl overflow-hidden';
        case 2:
          return 'sm:col-span-4 aspect-square rounded-2xl overflow-hidden';
        case 3:
          return 'sm:col-span-4 aspect-square rounded-2xl overflow-hidden';
        case 4:
          return 'sm:col-span-4 aspect-square rounded-2xl overflow-hidden';
        default:
          return 'sm:col-span-6 aspect-[4/3] rounded-2xl overflow-hidden';
      }
    },
  },
};

/**
 * Returns the layout configuration or defaults to 'single-hero'.
 */
export function getLayoutConfig(layoutType?: MomentLayoutType | null): LayoutConfig {
  if (layoutType && MOMENT_LAYOUTS[layoutType]) {
    return MOMENT_LAYOUTS[layoutType];
  }
  return MOMENT_LAYOUTS['single-hero'];
}

/**
 * Validates and merges presentation settings.
 */
export function resolvePresentationSettings(
  settings?: Record<string, unknown> | null
): MomentPresentationSettings {
  if (!settings) return { layout: 'single-hero' };
  const layout = (settings.layout as MomentLayoutType) || 'single-hero';
  return {
    layout: MOMENT_LAYOUTS[layout] ? layout : 'single-hero',
    filter: typeof settings.filter === 'string' ? settings.filter : undefined,
    aspect_ratio: typeof settings.aspect_ratio === 'string' ? settings.aspect_ratio : undefined,
  };
}
