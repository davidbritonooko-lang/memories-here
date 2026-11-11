import { describe, it, expect } from 'vitest';
import {
  extractImageDimensions,
  extractVideoMetadata,
  generateVideoThumbnailBlob,
} from '@/lib/media/metadata';
import {
  uploadAndRegisterPhoto,
  uploadAndRegisterVideo,
  uploadAndRegisterTrack,
} from '@/lib/media/service';
import { photosRepo, videosRepo, soundtrackRepo } from '@/lib/supabase/db';

describe('Phase 7: Media Foundation Acceptance Tests', () => {
  describe('Metadata Extraction (Spec Section 16, 17, 47)', () => {
    it('exports metadata extraction utilities', () => {
      expect(typeof extractImageDimensions).toBe('function');
      expect(typeof extractVideoMetadata).toBe('function');
      expect(typeof generateVideoThumbnailBlob).toBe('function');
    });

    it('gracefully handles non-browser environment for image dimensions', async () => {
      // happy-dom / mock environment without Image canvas
      const blob = new Blob(['mock image data'], { type: 'image/jpeg' });
      const result = await extractImageDimensions(blob);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('aspectRatio');
    });

    it('gracefully handles non-browser environment for video metadata', async () => {
      const blob = new Blob(['mock video data'], { type: 'video/mp4' });
      const result = await extractVideoMetadata(blob);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('durationSeconds');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('hasAudio');
    });
  });

  describe('Database Repositories for Media (Spec Section 16, 17)', () => {
    it('photosRepo exposes complete CRUD & archive methods', () => {
      expect(typeof photosRepo.listByWorld).toBe('function');
      expect(typeof photosRepo.getById).toBe('function');
      expect(typeof photosRepo.create).toBe('function');
      expect(typeof photosRepo.softDelete).toBe('function');
      expect(typeof photosRepo.restore).toBe('function');
    });

    it('videosRepo exposes complete CRUD & archive methods', () => {
      expect(typeof videosRepo.listByWorld).toBe('function');
      expect(typeof videosRepo.getById).toBe('function');
      expect(typeof videosRepo.create).toBe('function');
      expect(typeof videosRepo.softDelete).toBe('function');
      expect(typeof videosRepo.restore).toBe('function');
    });

    it('soundtrackRepo exposes track generation methods', () => {
      expect(typeof soundtrackRepo.listTracks).toBe('function');
      expect(typeof soundtrackRepo.createNextTrack).toBe('function');
    });
  });

  describe('Media Upload & Database Orchestration Service (Spec Section 16, 17, 20)', () => {
    it('exports high-level registration functions', () => {
      expect(typeof uploadAndRegisterPhoto).toBe('function');
      expect(typeof uploadAndRegisterVideo).toBe('function');
      expect(typeof uploadAndRegisterTrack).toBe('function');
    });

    it('validates photo MIME types before processing', async () => {
      const invalidFile = new File(['text content'], 'document.pdf', {
        type: 'application/pdf',
      });
      const res = await uploadAndRegisterPhoto('world-test', invalidFile);
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect(res.error).toContain("isn't supported");
    });

    it('validates video MIME types before processing', async () => {
      const invalidFile = new File(['text content'], 'sample.txt', {
        type: 'text/plain',
      });
      const res = await uploadAndRegisterVideo('world-test', invalidFile);
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });

    it('validates audio MIME types before processing', async () => {
      const invalidFile = new File(['image'], 'photo.png', {
        type: 'image/png',
      });
      const res = await uploadAndRegisterTrack('world-test', invalidFile);
      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
    });
  });
});
