import { describe, it, expect } from 'vitest';
import { PRODUCT_IDENTITY, APPROVED_NAVIGATION } from '@/types/constants';
import { cn } from '@/utils/cn';

describe('Phase 1: Project Foundation Acceptance Tests', () => {
  it('correctly defines the core product identity according to spec section 1', () => {
    expect(PRODUCT_IDENTITY.name).toBe('Peshie — Her World');
    expect(PRODUCT_IDENTITY.positioning).toBe('A little corner of the internet that belongs to her.');
    expect(PRODUCT_IDENTITY.statement).toBe('I noticed these things about your life, and I thought they were worth keeping.');
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
