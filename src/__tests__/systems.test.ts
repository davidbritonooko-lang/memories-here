/**
 * Phase 17 to 21 Acceptance Tests
 * Validates Installation Engine, Offline Engine, Theme System, Settings, and Home Experience.
 * Specification Sections: 6, 7, 29, 30, 31, 32, 48
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InstallationEngine } from '@/engines/installation/engine';
import { OfflineEngine } from '@/engines/offline/engine';
import { getAmbientGreeting } from '@/features/home/greeting';
import { worldRepo } from '@/lib/supabase/db';

describe('Phase 17 to 21 Acceptance Tests', () => {
  // ---------------------------------------------------------------------------
  // Phase 17: Installation Engine
  // ---------------------------------------------------------------------------
  describe('Phase 17: Installation Engine (Spec Section 31, 32)', () => {
    let engine: InstallationEngine;

    beforeEach(() => {
      engine = new InstallationEngine();
    });

    it('initializes with platform detection and install state', () => {
      const state = engine.getState();
      expect(typeof state.isStandalone).toBe('boolean');
      expect(typeof state.isInstallable).toBe('boolean');
      expect(typeof state.isInstalled).toBe('boolean');
      expect(['ios', 'android', 'desktop', 'unknown']).toContain(state.platform);
    });

    it('subscribes to state updates and fires immediately with current state', () => {
      let notified = false;
      const unsubscribe = engine.subscribe((s) => {
        if (s) notified = true;
      });
      expect(notified).toBe(true);
      unsubscribe();
    });

    it('returns false for promptInstall when no deferred prompt is captured', async () => {
      const result = await engine.promptInstall();
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Phase 18: Offline Engine
  // ---------------------------------------------------------------------------
  describe('Phase 18: Offline Engine (Spec Section 29, 30)', () => {
    let engine: OfflineEngine;

    beforeEach(() => {
      engine = new OfflineEngine();
    });

    it('tracks online status and storage estimates', () => {
      const state = engine.getState();
      expect(typeof state.isOnline).toBe('boolean');
      expect(typeof state.usedBytes).toBe('number');
      expect(typeof state.quotaBytes).toBe('number');
    });

    it('estimateStorage returns valid storage numbers', async () => {
      const estimate = await engine.estimateStorage();
      expect(estimate.usedBytes).toBeGreaterThanOrEqual(0);
      expect(estimate.quotaBytes).toBeGreaterThanOrEqual(0);
    });

    it('clearCache executes without throwing', async () => {
      const ok = await engine.clearCache();
      expect(typeof ok).toBe('boolean');
    });
  });

  // ---------------------------------------------------------------------------
  // Phase 20: Settings & World Preferences
  // ---------------------------------------------------------------------------
  describe('Phase 20: Settings Preferences (Spec Section 6, 7)', () => {
    it('worldRepo exposes updatePreferences method', () => {
      expect(typeof worldRepo.updatePreferences).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // Phase 21: Home Ambient Greetings
  // ---------------------------------------------------------------------------
  describe('Phase 21: Home Ambient Experience (Spec Section 1)', () => {
    it('getAmbientGreeting produces personalized greetings with title and subtitle', () => {
      const greeting = getAmbientGreeting('Taylor');
      expect(typeof greeting.title).toBe('string');
      expect(greeting.title).toContain('Taylor');
      expect(typeof greeting.subtitle).toBe('string');
      expect(greeting.subtitle.length).toBeGreaterThan(10);
    });

    it('getAmbientGreeting falls back to default name when omitted', () => {
      const greeting = getAmbientGreeting();
      expect(greeting.title).toContain('there');
    });
  });
});
