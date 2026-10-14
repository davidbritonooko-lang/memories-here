import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import {
  generateAccessIdentity,
  extractAccessIdentityFromUrl,
  getStoredWorldIdentity,
  setStoredWorldIdentity,
  clearStoredWorldIdentity,
} from '@/lib/world/identity';
import {
  WorldIdentityProvider,
  useWorldIdentity,
} from '@/features/identity/WorldIdentityProvider';
import { PlayfulIdentityGate } from '@/features/identity/PlayfulIdentityGate';

describe('Phase 4: World Identity Acceptance Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Cryptographic Private World Access (Spec Section 12)', () => {
    it('generates high-entropy, unguessable access tokens', () => {
      const token1 = generateAccessIdentity();
      const token2 = generateAccessIdentity();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(32);
    });

    it('extracts access identity from URL search parameters', () => {
      expect(extractAccessIdentityFromUrl('?access=secret123abc')).toBe('secret123abc');
      expect(extractAccessIdentityFromUrl('?key=mykey456')).toBe('mykey456');
      expect(extractAccessIdentityFromUrl('?other=123')).toBeNull();
    });

    it('persists and restores world identity in local storage', () => {
      const identity = {
        worldId: 'world_123',
        displayName: 'Peshie',
        accessIdentity: 'unguessable_token_xyz',
        isIdentified: true,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      setStoredWorldIdentity(identity);
      const retrieved = getStoredWorldIdentity();
      expect(retrieved).toEqual(identity);

      clearStoredWorldIdentity();
      expect(getStoredWorldIdentity()).toBeNull();
    });
  });

  describe('Playful Identity Experience (Spec Section 11)', () => {
    it('presents the playful question instead of conventional login', () => {
      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      // Verify exact specification phrase: "who's the pretty girl around here?"
      expect(screen.getByText(/who's the pretty girl/i)).toBeDefined();

      // Verify it does NOT contain email/password fields
      expect(screen.queryByLabelText(/email/i)).toBeNull();
      expect(screen.queryByLabelText(/password/i)).toBeNull();

      // World content should be gated
      expect(screen.queryByTestId('world-content')).toBeNull();
    });

    it('identifies her name and transitions with "I\'ll remember you forever."', async () => {
      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      const input = screen.getByPlaceholderText(/your name.../i);
      fireEvent.change(input, { target: { value: 'Peshie' } });

      const submitButton = screen.getByRole('button', { name: /it's me/i });
      fireEvent.click(submitButton);

      // Verify specification transition phrase
      expect(await screen.findByText(/I'll remember you forever\./i)).toBeDefined();
      expect(await screen.findByText(/welcome home, peshie/i)).toBeDefined();

      // World content should now be unlocked after transition completes
      const content = await screen.findByTestId('world-content', {}, { timeout: 3000 });
      expect(content).toBeDefined();

      // Verify identity was stored in localStorage
      const stored = getStoredWorldIdentity();
      expect(stored).not.toBeNull();
      expect(stored?.displayName).toBe('Peshie');
      expect(stored?.isIdentified).toBe(true);
    });

    it('immediately unlocks world when valid identity is already stored (returning visit)', () => {
      setStoredWorldIdentity({
        worldId: 'world_returning',
        displayName: 'Peshie',
        accessIdentity: 'token_returning',
        isIdentified: true,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      });

      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      expect(screen.getByTestId('world-content')).toBeDefined();
      expect(screen.queryByText(/who's the pretty girl/i)).toBeNull();
    });
  });

  describe('New Phone Restoration (Spec Section 2)', () => {
    it('restores her world when providing an access token', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WorldIdentityProvider>{children}</WorldIdentityProvider>
      );

      const { result } = renderHook(() => useWorldIdentity(), { wrapper });

      await act(async () => {
        const success = await result.current.restoreWorldWithToken('token_new_phone_123');
        expect(success).toBe(true);
      });

      expect(result.current.isIdentified).toBe(true);
      expect(result.current.identity?.accessIdentity).toBe('token_new_phone_123');
    });
  });
});
