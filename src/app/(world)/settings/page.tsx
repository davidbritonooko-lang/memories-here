'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  HardDrive,
  Download,
  CheckCircle2,
  User,
  Sparkles,
} from 'lucide-react';
import { useWorldIdentity } from '@/features/identity';
import { useTheme } from '@/features/settings';
import { useMusic } from '@/engines/music';
import { useOffline } from '@/engines/offline';
import { useInstallation } from '@/engines/installation';
import { worldRepo } from '@/lib/supabase/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import type { ThemePreference } from '@/types';
import { APP_NAME } from '@/types/constants';

export default function SettingsPage() {
  const { identity } = useWorldIdentity();
  const { theme, setTheme } = useTheme();
  const { engine, state: musicState } = useMusic();
  const { usedMB, quotaMB, clearCache, refreshEstimate } = useOffline();
  const { isInstalled, isInstallable, promptInstall, platform } = useInstallation();
  const { showToast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const worldId = identity?.worldId ?? null;

  const handleSavePreferences = async () => {
    if (!worldId) {
      showToast('Your private space is unavailable. Reconnect and try again.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await worldRepo.updatePreferences(worldId, {
        theme,
        music_volume: musicState.volume,
        offline_preferences: {
          auto_cache_moments: true,
          max_storage_mb: 1024,
        },
      });
      showToast('Preferences saved.', 'success');
    } catch {
      showToast("Couldn't sync preferences to cloud.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const ok = await clearCache();
      if (ok) {
        showToast('Local offline cache cleared.', 'success');
      } else {
        showToast('No active cache found to clear.', 'info');
      }
      await refreshEstimate();
    } catch {
      showToast("Couldn't clear cache.", 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      showToast(`${APP_NAME} installed successfully!`, 'success');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-accent/10 text-accent">
            <SettingsIcon className="w-5 h-5" />
          </span>
          <h1 className="font-editorial text-3xl font-semibold text-primary-text tracking-tight">
            Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-secondary-text">
          Personalize the appearance, audio, and offline settings of your private space.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Identity & World Information */}
        <Card variant="default" className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary-text">Identity & Space</h2>
              <p className="text-xs text-secondary-text">Your profile and private-space details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="p-3 rounded-xl bg-surface border border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-text">
                Display Name
              </span>
              <p className="mt-0.5 text-sm font-medium text-primary-text">
                {identity?.displayName || 'Not set'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-text">
                World Identifier
              </span>
              <p className="mt-0.5 text-xs font-mono text-secondary-text truncate">
                {worldId || 'Unavailable'}
              </p>
            </div>
          </div>
        </Card>

        {/* Theme Preference */}
        <Card variant="default" className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary-text">Appearance & Theme</h2>
              <p className="text-xs text-secondary-text">Choose between gentle light or deep midnight.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            {(
              [
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Laptop },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id as ThemePreference)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent shadow-sm'
                      : 'bg-surface border-border text-secondary-text hover:border-accent/40'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Soundtrack & Audio Atmosphere */}
        <Card variant="default" className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary-text">Soundtrack Master Volume</h2>
              <p className="text-xs text-secondary-text">Calibrate the ambient background music level.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => engine.setVolume(musicState.volume === 0 ? 0.7 : 0)}
              className="p-2 rounded-xl bg-surface border border-border text-secondary-text hover:text-primary-text"
            >
              {musicState.volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicState.volume}
              onChange={(e) => engine.setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-accent cursor-pointer"
            />

            <span className="text-xs font-mono font-medium text-primary-text w-12 text-right">
              {Math.round(musicState.volume * 100)}%
            </span>
          </div>
        </Card>

        {/* Browser Storage Cache */}
        <Card variant="default" className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary-text">Offline Storage</h2>
                <p className="text-xs text-secondary-text">Browser storage currently used by the app. Media downloads for offline use are not available yet.</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleClearCache}
              disabled={isClearing}
            >
              {isClearing ? <Spinner size="sm" /> : 'Clear Cache'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border text-xs">
            <span className="text-secondary-text">Storage Usage:</span>
            <span className="font-mono font-semibold text-primary-text">
              {usedMB} MB {quotaMB > 0 ? `of ${quotaMB} MB` : ''}
            </span>
          </div>
        </Card>

        {/* PWA App Installation */}
        <Card variant="default" className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary-text">App Experience</h2>
                <p className="text-xs text-secondary-text">Install Peshie on your device.</p>
              </div>
            </div>

            {isInstalled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Installed
              </span>
            ) : isInstallable ? (
              <Button size="sm" onClick={handleInstallClick}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Install App
              </Button>
            ) : platform === 'ios' ? (
              <span className="text-xs text-muted-text">
                Tap <span className="font-semibold text-accent">Share</span> then <span className="font-semibold text-accent">Add to Home Screen</span>
              </span>
            ) : (
              <span className="text-xs text-muted-text">Standalone ready</span>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Save Actions */}
      <div className="flex items-center justify-end gap-3 mt-4">
        <Button onClick={handleSavePreferences} disabled={isSaving || !worldId}>
          {isSaving ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
          Save World Preferences
        </Button>
      </div>
    </div>
  );
}
