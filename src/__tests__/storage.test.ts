import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  STORAGE_BUCKETS,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  FILE_TYPE_LABELS,
  buildStoragePath,
} from '@/lib/storage/constants';

import {
  isAllowedMimeType,
  isWithinSizeLimit,
  validateFile,
  validateFiles,
} from '@/lib/storage/validation';

import {
  uploadFile,
  uploadFiles,
  getSignedUrl,
  getSignedUrls,
  downloadFile,
  deleteFile,
  deleteFiles,
} from '@/lib/storage/client';

describe('Phase 6: Storage Foundation Acceptance Tests', () => {
  // -----------------------------------------------------------------------
  // Migration file
  // -----------------------------------------------------------------------
  describe('Storage Bucket Migration (Spec Sections 4, 16, 17, 20, 48)', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/002_storage_buckets.sql',
    );

    it('migration script 002_storage_buckets.sql exists and is non-empty', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content.length).toBeGreaterThan(200);
    });

    it('defines all required storage buckets', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain("'photos'");
      expect(content).toContain("'videos'");
      expect(content).toContain("'audio'");
      expect(content).toContain("'thumbnails'");
    });

    it('all buckets are private (public = false)', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      // Each INSERT should have `false` for public column
      expect(content).not.toContain('public, true');
      // Verify explicit false
      const falseCount = (content.match(/false/g) || []).length;
      expect(falseCount).toBeGreaterThanOrEqual(4);
    });

    it('defines file size limits for each bucket', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      // 50 MB, 500 MB, 100 MB, 5 MB
      expect(content).toContain('52428800');
      expect(content).toContain('524288000');
      expect(content).toContain('104857600');
      expect(content).toContain('5242880');
    });

    it('defines storage RLS policies for all buckets', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      const buckets = ['photos', 'videos', 'audio', 'thumbnails'];
      for (const bucket of buckets) {
        // Each bucket should have INSERT/SELECT/UPDATE/DELETE policies
        expect(content).toContain(`bucket_id = '${bucket}'`);
      }
      // At least 16 policies (4 operations × 4 buckets)
      const policyCount = (content.match(/CREATE POLICY/g) || []).length;
      expect(policyCount).toBeGreaterThanOrEqual(16);
    });
  });

  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------
  describe('Storage Constants', () => {
    it('exports all required bucket identifiers', () => {
      expect(STORAGE_BUCKETS.PHOTOS).toBe('photos');
      expect(STORAGE_BUCKETS.VIDEOS).toBe('videos');
      expect(STORAGE_BUCKETS.AUDIO).toBe('audio');
      expect(STORAGE_BUCKETS.THUMBNAILS).toBe('thumbnails');
    });

    it('exports correct file size limits matching migration values', () => {
      expect(MAX_FILE_SIZE.PHOTO).toBe(50 * 1024 * 1024);
      expect(MAX_FILE_SIZE.VIDEO).toBe(500 * 1024 * 1024);
      expect(MAX_FILE_SIZE.AUDIO).toBe(100 * 1024 * 1024);
      expect(MAX_FILE_SIZE.THUMBNAIL).toBe(5 * 1024 * 1024);
    });

    it('exports allowed MIME types for all media categories', () => {
      expect(ALLOWED_MIME_TYPES.PHOTO).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES.PHOTO).toContain('image/png');
      expect(ALLOWED_MIME_TYPES.PHOTO).toContain('image/webp');
      expect(ALLOWED_MIME_TYPES.PHOTO).toContain('image/heic');

      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/mp4');
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/webm');
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/quicktime');

      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/mpeg');
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/mp4');
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/wav');
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/flac');

      expect(ALLOWED_MIME_TYPES.THUMBNAIL).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES.THUMBNAIL).toContain('image/webp');
    });

    it('exports human-readable labels for all buckets', () => {
      expect(FILE_TYPE_LABELS.photos).toBe('photo');
      expect(FILE_TYPE_LABELS.videos).toBe('video');
      expect(FILE_TYPE_LABELS.audio).toBe('audio track');
      expect(FILE_TYPE_LABELS.thumbnails).toBe('thumbnail');
    });

    it('builds world-scoped storage paths', () => {
      const p = buildStoragePath('world-123', 'photos', 'sunset.jpg');
      expect(p).toMatch(/^world-123\/photos\/\d+_sunset\.jpg$/);
    });

    it('sanitises dangerous characters from filenames', () => {
      const p = buildStoragePath('w1', 'videos', '../etc/passwd');
      expect(p).not.toContain('..');
      expect(p).not.toContain('/etc');
      expect(p).toMatch(/^w1\/videos\/\d+_/);
    });
  });

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------
  describe('File Validation (Spec Sections 16, 17, 20, 48)', () => {
    it('accepts valid photo files', () => {
      const result = validateFile('photos', {
        type: 'image/jpeg',
        size: 2 * 1024 * 1024,
        name: 'photo.jpg',
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects photos with invalid MIME type', () => {
      const result = validateFile('photos', {
        type: 'application/pdf',
        size: 1024,
        name: 'doc.pdf',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).not.toContain('application/pdf'); // No raw tech details
    });

    it('rejects photos exceeding the size limit', () => {
      const result = validateFile('photos', {
        type: 'image/jpeg',
        size: 60 * 1024 * 1024, // 60 MB > 50 MB limit
        name: 'huge.jpg',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('rejects files with empty MIME type', () => {
      const result = validateFile('videos', {
        type: '',
        size: 1024,
        name: 'unknown',
      });
      expect(result.valid).toBe(false);
    });

    it('accepts valid audio files', () => {
      const result = validateFile('audio', {
        type: 'audio/mpeg',
        size: 8 * 1024 * 1024,
        name: 'track.mp3',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts valid video files within size limit', () => {
      const result = validateFile('videos', {
        type: 'video/mp4',
        size: 100 * 1024 * 1024,
        name: 'clip.mp4',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects zero-byte files', () => {
      const result = validateFile('photos', {
        type: 'image/jpeg',
        size: 0,
        name: 'empty.jpg',
      });
      expect(result.valid).toBe(false);
    });

    it('validates multiple files and returns first failure', () => {
      const result = validateFiles('photos', [
        { type: 'image/jpeg', size: 1024, name: 'ok.jpg' },
        { type: 'application/pdf', size: 1024, name: 'bad.pdf' },
        { type: 'image/png', size: 1024, name: 'ok.png' },
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('passes when all files in a batch are valid', () => {
      const result = validateFiles('photos', [
        { type: 'image/jpeg', size: 1024 },
        { type: 'image/png', size: 2048 },
        { type: 'image/webp', size: 4096 },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Validation helper functions
  // -----------------------------------------------------------------------
  describe('Validation Helper Functions', () => {
    it('isAllowedMimeType returns true for valid types', () => {
      expect(isAllowedMimeType('photos', 'image/jpeg')).toBe(true);
      expect(isAllowedMimeType('videos', 'video/mp4')).toBe(true);
      expect(isAllowedMimeType('audio', 'audio/mpeg')).toBe(true);
      expect(isAllowedMimeType('thumbnails', 'image/webp')).toBe(true);
    });

    it('isAllowedMimeType returns false for invalid types', () => {
      expect(isAllowedMimeType('photos', 'text/plain')).toBe(false);
      expect(isAllowedMimeType('videos', 'image/jpeg')).toBe(false);
      expect(isAllowedMimeType('audio', 'video/mp4')).toBe(false);
    });

    it('isAllowedMimeType is case-insensitive', () => {
      expect(isAllowedMimeType('photos', 'IMAGE/JPEG')).toBe(true);
    });

    it('isWithinSizeLimit accepts files within limits', () => {
      expect(isWithinSizeLimit('photos', 1024)).toBe(true);
      expect(isWithinSizeLimit('videos', 100 * 1024 * 1024)).toBe(true);
    });

    it('isWithinSizeLimit rejects files over limits', () => {
      expect(isWithinSizeLimit('photos', 51 * 1024 * 1024)).toBe(false);
      expect(isWithinSizeLimit('thumbnails', 6 * 1024 * 1024)).toBe(false);
    });

    it('isWithinSizeLimit rejects zero or negative sizes', () => {
      expect(isWithinSizeLimit('photos', 0)).toBe(false);
      expect(isWithinSizeLimit('photos', -1)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Storage client function signatures
  // -----------------------------------------------------------------------
  describe('Storage Client API Surface', () => {
    it('exports all required storage operations', () => {
      expect(typeof uploadFile).toBe('function');
      expect(typeof uploadFiles).toBe('function');
      expect(typeof getSignedUrl).toBe('function');
      expect(typeof getSignedUrls).toBe('function');
      expect(typeof downloadFile).toBe('function');
      expect(typeof deleteFile).toBe('function');
      expect(typeof deleteFiles).toBe('function');
    });
  });

  // -----------------------------------------------------------------------
  // Error message tone (Spec Section 46)
  // -----------------------------------------------------------------------
  describe('User-Facing Error Messages (Spec Section 46)', () => {
    it('never exposes raw technical errors in validation messages', () => {
      const badMime = validateFile('photos', { type: 'text/html', size: 100 });
      const tooBig = validateFile('videos', { type: 'video/mp4', size: 600 * 1024 * 1024 });

      // Must not contain raw MIME strings, HTTP codes, or technical jargon
      for (const result of [badMime, tooBig]) {
        expect(result.error).not.toMatch(/^Error:/i);
        expect(result.error).not.toMatch(/500\s+(Internal\s+)?Server\s+Error/i);
        expect(result.error).not.toContain('text/html');
        expect(result.error).not.toContain('Unhandled');
      }
    });
  });
});
