/**
 * Phase 10: Moments — List & Creation Acceptance Tests
 * Validates formatting utilities, repository signatures, and feature contracts.
 * Specification Sections: 14, 15, 18, 19
 */

import { describe, it, expect } from 'vitest';
import {
  formatMomentDate,
  relativeTimeLabel,
  mediaSummary,
  totalMediaCount,
  getHeroThumbnail,
  sortMomentsByDate,
  todayISO,
} from '@/features/moments/utils';
import type { MomentWithMedia } from '@/features/moments/utils';
import { momentsRepo } from '@/lib/supabase/db';

// ---------------------------------------------------------------------------
// Helper: create a minimal MomentWithMedia
// ---------------------------------------------------------------------------
function makeMoment(overrides: Partial<MomentWithMedia> = {}): MomentWithMedia {
  return {
    id: 'moment-1',
    world_id: 'world-1',
    title: 'Sunday at the park',
    date: '2026-06-15',
    is_draft: false,
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
    moment_photos: [],
    moment_videos: [],
    moment_tracks: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Date Formatting
// ---------------------------------------------------------------------------
describe('Phase 10: Moments Acceptance Tests', () => {
  describe('Date Formatting (Spec Section 18)', () => {
    it('formats date in long style', () => {
      const result = formatMomentDate('2026-06-15', 'long');
      expect(result).toContain('June');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('formats date in short style', () => {
      const result = formatMomentDate('2026-06-15', 'short');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('returns original string for invalid dates', () => {
      expect(formatMomentDate('not-a-date')).toBe('not-a-date');
    });

    it('todayISO returns YYYY-MM-DD format', () => {
      const today = todayISO();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // Relative Time
  // ---------------------------------------------------------------------------
  describe('Relative Time Labels', () => {
    it('returns "Just now" for very recent timestamps', () => {
      const now = new Date().toISOString();
      expect(relativeTimeLabel(now)).toBe('Just now');
    });

    it('returns empty string for invalid dates', () => {
      expect(relativeTimeLabel('garbage')).toBe('');
    });

    it('returns minute-based labels', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      expect(relativeTimeLabel(fiveMinAgo)).toBe('5m ago');
    });

    it('returns day-based labels', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
      expect(relativeTimeLabel(threeDaysAgo)).toBe('3d ago');
    });
  });

  // ---------------------------------------------------------------------------
  // Media Summary
  // ---------------------------------------------------------------------------
  describe('Media Summary Badges', () => {
    it('returns "Empty moment" when no media attached', () => {
      expect(mediaSummary(makeMoment())).toBe('Empty moment');
    });

    it('counts photos correctly', () => {
      const moment = makeMoment({
        moment_photos: [
          { id: 'p1', sort_order: 0, photo: { id: '1', world_id: 'w', storage_path: '/a.jpg', mime_type: 'image/jpeg', file_size: 1000, created_at: '' } },
          { id: 'p2', sort_order: 1, photo: { id: '2', world_id: 'w', storage_path: '/b.jpg', mime_type: 'image/jpeg', file_size: 1000, created_at: '' } },
        ],
      });
      expect(mediaSummary(moment)).toBe('2 photos');
    });

    it('combines photos and videos with separator', () => {
      const moment = makeMoment({
        moment_photos: [
          { id: 'p1', sort_order: 0, photo: { id: '1', world_id: 'w', storage_path: '/a.jpg', mime_type: 'image/jpeg', file_size: 1000, created_at: '' } },
        ],
        moment_videos: [
          { id: 'v1', sort_order: 0, video: { id: '1', world_id: 'w', storage_path: '/v.mp4', duration_seconds: 30, mime_type: 'video/mp4', file_size: 5000, has_audio: true, created_at: '' } },
        ],
      });
      expect(mediaSummary(moment)).toBe('1 photo · 1 video');
    });

    it('totalMediaCount sums all media types', () => {
      const moment = makeMoment({
        moment_photos: [{ id: 'p1', sort_order: 0 }],
        moment_videos: [{ id: 'v1', sort_order: 0 }, { id: 'v2', sort_order: 1 }],
        moment_tracks: [{ id: 't1', sort_order: 0 }],
      });
      expect(totalMediaCount(moment)).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Hero Thumbnail
  // ---------------------------------------------------------------------------
  describe('Hero Thumbnail Extraction', () => {
    it('returns first photo path when available', () => {
      const moment = makeMoment({
        moment_photos: [
          { id: 'p1', sort_order: 1, photo: { id: '1', world_id: 'w', storage_path: '/second.jpg', mime_type: 'image/jpeg', file_size: 1000, created_at: '' } },
          { id: 'p2', sort_order: 0, photo: { id: '2', world_id: 'w', storage_path: '/first.jpg', mime_type: 'image/jpeg', file_size: 1000, created_at: '' } },
        ],
      });
      expect(getHeroThumbnail(moment)).toBe('/first.jpg');
    });

    it('falls back to video thumbnail when no photos', () => {
      const moment = makeMoment({
        moment_videos: [
          { id: 'v1', sort_order: 0, video: { id: '1', world_id: 'w', storage_path: '/v.mp4', thumbnail_path: '/thumb.webp', duration_seconds: 30, mime_type: 'video/mp4', file_size: 5000, has_audio: true, created_at: '' } },
        ],
      });
      expect(getHeroThumbnail(moment)).toBe('/thumb.webp');
    });

    it('returns null when no media at all', () => {
      expect(getHeroThumbnail(makeMoment())).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------
  describe('Moment Sorting', () => {
    it('sorts moments by date descending (newest first)', () => {
      const moments = [
        makeMoment({ id: 'old', date: '2024-01-01' }),
        makeMoment({ id: 'new', date: '2026-12-25' }),
        makeMoment({ id: 'mid', date: '2025-06-15' }),
      ];

      const sorted = sortMomentsByDate(moments);
      expect(sorted.map((m) => m.id)).toEqual(['new', 'mid', 'old']);
    });
  });

  // ---------------------------------------------------------------------------
  // Repository Signatures
  // ---------------------------------------------------------------------------
  describe('Moments Repository (Spec Section 14, 15)', () => {
    it('exposes all required CRUD + media association methods', () => {
      expect(typeof momentsRepo.listByWorld).toBe('function');
      expect(typeof momentsRepo.getById).toBe('function');
      expect(typeof momentsRepo.create).toBe('function');
      expect(typeof momentsRepo.update).toBe('function');
      expect(typeof momentsRepo.softDelete).toBe('function');
      expect(typeof momentsRepo.restore).toBe('function');
    });

    it('exposes photo/video/track association methods', () => {
      expect(typeof momentsRepo.addPhoto).toBe('function');
      expect(typeof momentsRepo.removePhoto).toBe('function');
      expect(typeof momentsRepo.addVideo).toBe('function');
      expect(typeof momentsRepo.removeVideo).toBe('function');
      expect(typeof momentsRepo.addTrack).toBe('function');
      expect(typeof momentsRepo.removeTrack).toBe('function');
    });
  });
});
