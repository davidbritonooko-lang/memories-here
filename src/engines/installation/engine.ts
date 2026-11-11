/**
 * Installation Engine
 * Manages Progressive Web App (PWA) installation lifecycle,
 * beforeinstallprompt capturing, and standalone mode detection.
 * Specification Sections: 31, 32
 */

export type PlatformType = 'ios' | 'android' | 'desktop' | 'unknown';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallationState {
  isStandalone: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  platform: PlatformType;
}

export class InstallationEngine {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private state: InstallationState = {
    isStandalone: false,
    isInstallable: false,
    isInstalled: false,
    platform: 'unknown',
  };
  private listeners: Set<(state: InstallationState) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.detectPlatform();
    this.checkStandalone();

    // Listen for beforeinstallprompt (Chromium / Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.updateState({ isInstallable: true });
    });

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.updateState({ isInstalled: true, isInstallable: false });
    });
  }

  private detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    let platform: PlatformType = 'unknown';

    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios';
    } else if (/android/.test(userAgent)) {
      platform = 'android';
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      platform = 'desktop';
    }

    this.state.platform = platform;
  }

  private checkStandalone() {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    this.state.isStandalone = isStandalone;
    if (isStandalone) {
      this.state.isInstalled = true;
    }
  }

  public getState(): InstallationState {
    return { ...this.state };
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.updateState({ isInstalled: true, isInstallable: false });
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public subscribe(listener: (state: InstallationState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private updateState(updates: Partial<InstallationState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((l) => l(this.getState()));
  }
}

let instance: InstallationEngine | null = null;
export function getInstallationEngine(): InstallationEngine {
  if (!instance) {
    instance = new InstallationEngine();
  }
  return instance;
}
