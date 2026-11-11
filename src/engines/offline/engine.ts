/**
 * Offline Engine
 * Tracks connectivity and browser storage, and provides an opt-in cache for
 * world-scoped private media. App pages still require a network connection.
 */

export const APP_CACHE_PREFIX = 'peshie-' as const;
export const MEDIA_CACHE_NAME = 'peshie-media-v1' as const;
const OFFLINE_MEDIA_PATH = '/__peshie_media_cache__';

export type OfflineMediaBucket = 'photos' | 'videos' | 'audio' | 'thumbnails';

export interface OfflineMediaAsset {
  worldId: string;
  bucket: OfflineMediaBucket;
  storagePath: string;
  signedUrl: string;
  sizeBytes: number;
}

export interface OfflineCacheResult {
  success: boolean;
  bytes: number;
}

export interface OfflineStorageState {
  isOnline: boolean;
  usedBytes: number;
  quotaBytes: number;
}

export function isWorldScopedMediaPath(
  worldId: string,
  bucket: OfflineMediaBucket,
  storagePath: string
): boolean {
  return Boolean(worldId) &&
    storagePath.startsWith(`${worldId}/${bucket}/`) &&
    !storagePath.split('/').some((segment) => segment === '.' || segment === '..');
}

export function buildOfflineMediaCacheUrl(
  origin: string,
  worldId: string,
  bucket: OfflineMediaBucket,
  storagePath: string
): string {
  const url = new URL(OFFLINE_MEDIA_PATH, origin);
  url.searchParams.set('world', worldId);
  url.searchParams.set('bucket', bucket);
  url.searchParams.set('path', storagePath);
  return url.toString();
}

export async function getCachedMediaUrl(
  worldId: string,
  bucket: OfflineMediaBucket,
  storagePath: string
): Promise<string | null> {
  if (
    typeof window === 'undefined' ||
    !('caches' in window) ||
    !isWorldScopedMediaPath(worldId, bucket, storagePath)
  ) {
    return null;
  }

  try {
    const key = buildOfflineMediaCacheUrl(window.location.origin, worldId, bucket, storagePath);
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const response = await cache.match(key);
    if (!response) return null;

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
    }
    return key;
  } catch {
    return null;
  }
}

export class OfflineEngine {
  private state: OfflineStorageState = {
    isOnline: true,
    usedBytes: 0,
    quotaBytes: 0,
  };
  private listeners: Set<(state: OfflineStorageState) => void> = new Set();

  private readonly handleOnline = () => this.updateState({ isOnline: true });
  private readonly handleOffline = () => this.updateState({ isOnline: false });

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.state.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    }
    void this.estimateStorage();
  }

  public async estimateStorage(): Promise<OfflineStorageState> {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        this.updateState({
          usedBytes: estimate.usage ?? 0,
          quotaBytes: estimate.quota ?? 0,
        });
      } catch {
        // Storage estimates are advisory and may be unavailable in restricted contexts.
      }
    }
    return this.getState();
  }

  public async isMediaCached(asset: Pick<OfflineMediaAsset, 'worldId' | 'bucket' | 'storagePath'>): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !('caches' in window) ||
      !isWorldScopedMediaPath(asset.worldId, asset.bucket, asset.storagePath)
    ) {
      return false;
    }

    try {
      const key = buildOfflineMediaCacheUrl(
        window.location.origin,
        asset.worldId,
        asset.bucket,
        asset.storagePath
      );
      const cache = await caches.open(MEDIA_CACHE_NAME);
      return Boolean(await cache.match(key));
    } catch {
      return false;
    }
  }

  public async getCachedMediaUsage(worldId: string): Promise<{ files: number; bytes: number }> {
    if (typeof window === 'undefined' || !('caches' in window) || !worldId) {
      return { files: 0, bytes: 0 };
    }

    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const requests = await cache.keys();
      const worldRequests = requests.filter((request) => {
        const url = new URL(request.url);
        return url.pathname === OFFLINE_MEDIA_PATH && url.searchParams.get('world') === worldId;
      });

      let bytes = 0;
      for (const request of worldRequests) {
        const response = await cache.match(request);
        const size = Number(response?.headers.get('content-length'));
        if (Number.isFinite(size) && size > 0) bytes += size;
      }

      return { files: worldRequests.length, bytes };
    } catch {
      return { files: 0, bytes: 0 };
    }
  }

  public async cacheMediaAsset(asset: OfflineMediaAsset): Promise<OfflineCacheResult> {
    if (
      typeof window === 'undefined' ||
      !('caches' in window) ||
      !navigator.onLine ||
      !isWorldScopedMediaPath(asset.worldId, asset.bucket, asset.storagePath) ||
      !Number.isFinite(asset.sizeBytes) ||
      asset.sizeBytes <= 0
    ) {
      return { success: false, bytes: 0 };
    }

    try {
      const signedUrl = new URL(asset.signedUrl);
      if (signedUrl.protocol !== 'https:') {
        return { success: false, bytes: 0 };
      }

      const response = await fetch(signedUrl, { credentials: 'omit' });
      if (!response.ok) return { success: false, bytes: 0 };

      const headerSize = Number(response.headers.get('content-length'));
      const actualSize = Number.isFinite(headerSize) && headerSize > 0
        ? headerSize
        : asset.sizeBytes;
      if (actualSize <= 0) return { success: false, bytes: 0 };

      const key = buildOfflineMediaCacheUrl(
        window.location.origin,
        asset.worldId,
        asset.bucket,
        asset.storagePath
      );
      const headers = new Headers(response.headers);
      headers.set('content-length', String(actualSize));
      const cache = await caches.open(MEDIA_CACHE_NAME);
      await cache.put(
        key,
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      );
      await this.estimateStorage();

      return { success: true, bytes: actualSize };
    } catch {
      return { success: false, bytes: 0 };
    }
  }

  /**
   * Delete only caches owned by this application. Clearing every Cache Storage
   * entry can break unrelated apps and service workers on the same origin.
   */
  public async clearCache(): Promise<boolean> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return false;
    }

    try {
      const keys = await caches.keys();
      const ownedKeys = keys.filter((key) => key.startsWith(APP_CACHE_PREFIX));
      if (ownedKeys.length === 0) return false;

      const deleted = await Promise.all(ownedKeys.map((key) => caches.delete(key)));
      await this.estimateStorage();
      return deleted.some(Boolean);
    } catch {
      return false;
    }
  }

  public getState(): OfflineStorageState {
    return { ...this.state };
  }

  public subscribe(listener: (state: OfflineStorageState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }

  private updateState(updates: Partial<OfflineStorageState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

let offlineInstance: OfflineEngine | null = null;
export function getOfflineEngine(): OfflineEngine {
  if (!offlineInstance) {
    offlineInstance = new OfflineEngine();
  }
  return offlineInstance;
}
