import { describe, it, expect } from 'vitest';
import {
  formatTrackTitle,
  formatDuration,
  sortTracksByNumber,
} from '@/features/soundtrack/utils';
import { soundtrackRepo, playlistsRepo } from '@/lib/supabase/db';
import type { Track } from '@/types';

describe('Phase 9: Music Library Acceptance Tests', () => {
  describe('Automatic Track Numbering & Naming (Spec Section 20)', () => {
    it('formats display title with auto-numbered prefix (TRACK 01, TRACK 02...)', () => {
      expect(formatTrackTitle(1)).toBe('TRACK 01');
      expect(formatTrackTitle(2)).toBe('TRACK 02');
      expect(formatTrackTitle(10)).toBe('TRACK 10');
    });

    it('appends custom title when provided', () => {
      expect(formatTrackTitle(3, 'Golden Hour')).toBe('TRACK 03 — Golden Hour');
    });

    it('avoids duplicate prefix if custom title already matches TRACK ##', () => {
      expect(formatTrackTitle(4, 'TRACK 04')).toBe('TRACK 04');
    });
  });

  describe('Duration Formatter', () => {
    it('formats seconds to mm:ss', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(45)).toBe('00:45');
      expect(formatDuration(185)).toBe('03:05');
    });

    it('formats long tracks to hh:mm:ss', () => {
      expect(formatDuration(3665)).toBe('1:01:05');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatDuration(-10)).toBe('00:00');
      expect(formatDuration(NaN)).toBe('00:00');
    });
  });

  describe('Track Sorting', () => {
    it('sorts tracks by track_number ascending', () => {
      const mockTracks: Track[] = [
        {
          id: 't-3',
          world_id: 'w-1',
          track_number: 3,
          title: 'TRACK 03',
          storage_path: 'path/3',
          duration_seconds: 120,
          mime_type: 'audio/mpeg',
          file_size: 1000,
          created_at: new Date().toISOString(),
        },
        {
          id: 't-1',
          world_id: 'w-1',
          track_number: 1,
          title: 'TRACK 01',
          storage_path: 'path/1',
          duration_seconds: 180,
          mime_type: 'audio/mpeg',
          file_size: 2000,
          created_at: new Date().toISOString(),
        },
      ];

      const sorted = sortTracksByNumber(mockTracks);
      expect(sorted[0].track_number).toBe(1);
      expect(sorted[1].track_number).toBe(3);
    });
  });

  describe('Database Repositories for Music Library (Spec Section 20, 21)', () => {
    it('soundtrackRepo exposes all library operations including softDelete & restore', () => {
      expect(typeof soundtrackRepo.listTracks).toBe('function');
      expect(typeof soundtrackRepo.createNextTrack).toBe('function');
      expect(typeof soundtrackRepo.updateTrack).toBe('function');
      expect(typeof soundtrackRepo.softDelete).toBe('function');
      expect(typeof soundtrackRepo.restore).toBe('function');
    });

    it('playlistsRepo exposes playlist CRUD and track association methods', () => {
      expect(typeof playlistsRepo.listByWorld).toBe('function');
      expect(typeof playlistsRepo.getById).toBe('function');
      expect(typeof playlistsRepo.create).toBe('function');
      expect(typeof playlistsRepo.addTrackToPlaylist).toBe('function');
      expect(typeof playlistsRepo.removeTrackFromPlaylist).toBe('function');
      expect(typeof playlistsRepo.delete).toBe('function');
    });
  });
});
