import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createSignedUrlMock, createSignedUrlsMock, getCachedMediaUrlMock } = vi.hoisted(() => ({
  createSignedUrlMock: vi.fn(),
  createSignedUrlsMock: vi.fn(),
  getCachedMediaUrlMock: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: createSignedUrlMock,
        createSignedUrls: createSignedUrlsMock,
      }),
    },
  }),
}));

vi.mock('@/engines/offline/engine', () => ({
  getCachedMediaUrl: getCachedMediaUrlMock,
}));

import { getSignedUrl, getSignedUrls } from '@/lib/storage/client';

describe('Private media offline URL fallback', () => {
  beforeEach(() => {
    createSignedUrlMock.mockReset();
    createSignedUrlsMock.mockReset();
    getCachedMediaUrlMock.mockReset();
  });

  it('prefers a fresh signed URL when Storage is reachable', async () => {
    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://storage.example/signed/photo.jpg' },
      error: null,
    });

    await expect(
      getSignedUrl('photos', 'world-1/photos/photo.jpg')
    ).resolves.toEqual({
      url: 'https://storage.example/signed/photo.jpg',
      error: null,
    });
    expect(getCachedMediaUrlMock).not.toHaveBeenCalled();
  });

  it('uses a cached world-scoped URL when Storage returns an error', async () => {
    createSignedUrlMock.mockResolvedValue({
      data: null,
      error: { message: 'network unavailable' },
    });
    getCachedMediaUrlMock.mockResolvedValue(
      'https://app.example/__peshie_media_cache__?world=world-1'
    );

    await expect(
      getSignedUrl('photos', 'world-1/photos/photo.jpg')
    ).resolves.toEqual({
      url: 'https://app.example/__peshie_media_cache__?world=world-1',
      error: null,
    });
    expect(getCachedMediaUrlMock).toHaveBeenCalledWith(
      'world-1',
      'photos',
      'world-1/photos/photo.jpg'
    );
  });

  it('uses a cached URL when the Storage request throws', async () => {
    createSignedUrlMock.mockRejectedValue(new Error('offline'));
    getCachedMediaUrlMock.mockResolvedValue(
      'https://app.example/__peshie_media_cache__?world=world-1'
    );

    await expect(
      getSignedUrl('photos', 'world-1/photos/photo.jpg')
    ).resolves.toMatchObject({
      url: 'https://app.example/__peshie_media_cache__?world=world-1',
      error: null,
    });
  });

  it('resolves cached media independently when batch signing fails', async () => {
    createSignedUrlsMock.mockRejectedValue(new Error('offline'));
    getCachedMediaUrlMock
      .mockResolvedValueOnce('https://app.example/cache/photo.jpg')
      .mockResolvedValueOnce(null);

    const result = await getSignedUrls('photos', [
      'world-1/photos/photo.jpg',
      'world-1/photos/missing.jpg',
    ]);

    expect(result.urls).toEqual([
      'https://app.example/cache/photo.jpg',
      null,
    ]);
    expect(result.error?.message).toBe('offline');
  });
});
