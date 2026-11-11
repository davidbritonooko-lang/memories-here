import { describe, it, expect } from 'vitest';
import { APP_NAME, PRODUCT_IDENTITY, APPROVED_NAVIGATION } from '@/types/constants';
import manifest from '@/app/manifest';
import { cn } from '@/utils/cn';

describe('Phase 1: Project Foundation Acceptance Tests', () => {
  it('keeps the production product name in one reusable constant', () => {
    expect(APP_NAME).toBe('Peshie');
    expect(PRODUCT_IDENTITY.name).toBe(APP_NAME);
    expect(PRODUCT_IDENTITY.positioning).toBe('A private space for moments, media, and memories.');
    expect(PRODUCT_IDENTITY.statement).toBe('Keep photos, videos, notes, and soundtracks together in one private space.');
  });

  it('uses the central product name in the installable web manifest', () => {
    const appManifest = manifest();
    expect(appManifest.name).toBe(PRODUCT_IDENTITY.name);
    expect(appManifest.short_name).toBe(APP_NAME);
  });

  it('verifies the approved product information architecture according to spec section 3', () => {
    const navIds = APPROVED_NAVIGATION.map(item => item.id);
    expect(navIds).toEqual(['home', 'moments', 'peshtok', 'soundtrack', 'archive', 'settings']);
  });

  it('correctly merges CSS utility classes via cn utility', () => {
    const merged = cn('p-4', 'bg-white', false && 'hidden', 'text-sm font-medium');
    expect(merged).toBe('p-4 bg-white text-sm font-medium');

    const overridden = cn('p-4', 'p-6');
    expect(overridden).toBe('p-6');
  });

  it('executes within a jsdom environment with DOM globals present', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    const el = document.createElement('div');
    el.textContent = 'Peshie';
    expect(el.textContent).toBe('Peshie');
  });
});
