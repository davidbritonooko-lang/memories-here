/**
 * Phase 11 & 12: Moment Detail & Editor Acceptance Tests
 * Validates layout engine, presentation configs, and media operations.
 * Specification Sections: 14, 15, 18, 19
 */

import { describe, it, expect } from 'vitest';
import {
  MOMENT_LAYOUTS,
  getLayoutConfig,
  resolvePresentationSettings,
} from '@/engines/moments';
import type { MomentLayoutType } from '@/types';
import { momentsRepo } from '@/lib/supabase/db';

describe('Phase 11 & 12: Moment Detail & Editor Acceptance Tests', () => {
  describe('Moment Layout Engine (Spec Section 18, 19)', () => {
    const requiredLayouts: MomentLayoutType[] = [
      'single-hero',
      'two-up',
      'three-grid',
      'film-strip',
      'portrait-feature',
      'mixed-collage',
    ];

    it('defines all 6 core layout presets with proper metadata', () => {
      for (const layoutId of requiredLayouts) {
        const layout = MOMENT_LAYOUTS[layoutId];
        expect(layout).toBeDefined();
        expect(layout.id).toBe(layoutId);
        expect(typeof layout.label).toBe('string');
        expect(typeof layout.description).toBe('string');
        expect(typeof layout.containerClassName).toBe('string');
        expect(typeof layout.getItemClassName).toBe('function');
      }
    });

    it('single-hero layout highlights the first element as prominent hero', () => {
      const layout = MOMENT_LAYOUTS['single-hero'];
      const heroClass = layout.getItemClassName(0, 3);
      const secondaryClass = layout.getItemClassName(1, 3);
      expect(heroClass).toContain('aspect-[4/3]');
      expect(secondaryClass).toContain('aspect-square');
    });

    it('two-up layout applies balanced grid columns', () => {
      const layout = MOMENT_LAYOUTS['two-up'];
      expect(layout.containerClassName).toContain('sm:grid-cols-2');
    });

    it('three-grid layout applies trio columns', () => {
      const layout = MOMENT_LAYOUTS['three-grid'];
      expect(layout.containerClassName).toContain('sm:grid-cols-3');
    });

    it('film-strip layout configures horizontal snap-scroll', () => {
      const layout = MOMENT_LAYOUTS['film-strip'];
      expect(layout.containerClassName).toContain('overflow-x-auto');
      expect(layout.containerClassName).toContain('snap-x');
    });

    it('portrait-feature layout respects 9:16 mobile portrait ratio', () => {
      const layout = MOMENT_LAYOUTS['portrait-feature'];
      const heroClass = layout.getItemClassName(0, 3);
      expect(heroClass).toContain('aspect-[9/16]');
    });

    it('mixed-collage layout distributes spans across 12-column grid', () => {
      const layout = MOMENT_LAYOUTS['mixed-collage'];
      expect(layout.containerClassName).toContain('grid-cols-12');
      const item0 = layout.getItemClassName(0, 5);
      const item1 = layout.getItemClassName(1, 5);
      expect(item0).toContain('col-span-8');
      expect(item1).toContain('col-span-4');
    });

    it('getLayoutConfig returns single-hero default for invalid or null types', () => {
      expect(getLayoutConfig(null).id).toBe('single-hero');
      expect(getLayoutConfig(undefined).id).toBe('single-hero');
      expect(getLayoutConfig('unknown-layout' as unknown as MomentLayoutType).id).toBe('single-hero');
    });

    it('resolvePresentationSettings safely parses raw presentation objects', () => {
      const res = resolvePresentationSettings({ layout: 'two-up', filter: 'warm' });
      expect(res.layout).toBe('two-up');
      expect(res.filter).toBe('warm');

      const fallback = resolvePresentationSettings(null);
      expect(fallback.layout).toBe('single-hero');
    });
  });

  describe('Database Operations for Moment Detail & Editing', () => {
    it('exposes all required get and update methods on momentsRepo', () => {
      expect(typeof momentsRepo.getById).toBe('function');
      expect(typeof momentsRepo.update).toBe('function');
      expect(typeof momentsRepo.softDelete).toBe('function');
    });

    it('exposes media association operations for photos, videos, and tracks', () => {
      expect(typeof momentsRepo.addPhoto).toBe('function');
      expect(typeof momentsRepo.removePhoto).toBe('function');
      expect(typeof momentsRepo.addVideo).toBe('function');
      expect(typeof momentsRepo.removeVideo).toBe('function');
      expect(typeof momentsRepo.addTrack).toBe('function');
      expect(typeof momentsRepo.removeTrack).toBe('function');
    });
  });
});
