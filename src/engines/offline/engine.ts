/**
 * Offline Engine
 * Tracks connectivity and storage usage, and limits cache cleanup to app-owned caches.
 * Media download and cross-device synchronization are not implemented in this engine.
 */

export const APP_CACHE_PREFIX = 'peshie-' as const;
export const MEDIA_CACHE_NAME = 'peshie-media-v1' as const;

export interface OfflineStorageState {
  isOnline: boolean;
  usedBytes: number;
  quotaBytes: number;
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
