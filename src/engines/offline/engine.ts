/**
 * Offline Engine
 * Coordinates client-side caching, storage quota estimation,
 * and network connectivity monitoring for Her World.
 * Specification Sections: 29, 30
 */

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

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.state.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.updateState({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.updateState({ isOnline: false });
    });

    void this.estimateStorage();
  }

  public async estimateStorage(): Promise<OfflineStorageState> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        this.updateState({
          usedBytes: estimate.usage || 0,
          quotaBytes: estimate.quota || 0,
        });
      } catch {
        // Fallback gracefully
      }
    }
    return this.getState();
  }

  public async clearCache(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await this.estimateStorage();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public getState(): OfflineStorageState {
    return { ...this.state };
  }

  public subscribe(listener: (state: OfflineStorageState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private updateState(updates: Partial<OfflineStorageState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((l) => l(this.getState()));
  }
}

let offlineInstance: OfflineEngine | null = null;
export function getOfflineEngine(): OfflineEngine {
  if (!offlineInstance) {
    offlineInstance = new OfflineEngine();
  }
  return offlineInstance;
}
