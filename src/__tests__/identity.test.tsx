import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import {
  generateAccessIdentity,
  extractAccessIdentityFromUrl,
  getStoredWorldIdentity,
  setStoredWorldIdentity,
  getStoredAccessIdentity,
  clearStoredWorldIdentity,
} from '@/lib/world/identity';
import {
  WorldIdentityProvider,
  useWorldIdentity,
} from '@/features/identity/WorldIdentityProvider';
import { PlayfulIdentityGate } from '@/features/identity/PlayfulIdentityGate';

describe('Phase 4: World Identity Acceptance Tests', () => {
  const serverIdentity = {
    worldId: '23b3a87f-8ca1-4d7f-9afd-c194b6b993af',
    displayName: 'Taylor',
    isIdentified: true,
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (!init?.method) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ error: 'No active world session.' }),
          } as Response;
        }

        const body = JSON.parse(String(init.body)) as {
          action: string;
          accessIdentity?: string;
          displayName?: string;
        };
        if (body.action === 'logout') {
          return { ok: true, status: 204, json: async () => ({}) } as Response;
        }

        if (body.action === 'restore' && body.accessIdentity === 'a'.repeat(64)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ identity: serverIdentity }),
          } as Response;
        }

        if (body.action === 'identify') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              identity: { ...serverIdentity, displayName: body.displayName },
            }),
          } as Response;
        }

        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'That access key was not recognized.' }),
        } as Response;
      })
    );
  });

  describe('Cryptographic Private World Access (Spec Section 12)', () => {
    it('generates high-entropy, unguessable access tokens', () => {
      const token1 = generateAccessIdentity();
      const token2 = generateAccessIdentity();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-f\d]{64}$/i);
    });

    it('extracts access identity from URL search parameters', () => {
      expect(extractAccessIdentityFromUrl('?access=secret123abc')).toBe('secret123abc');
      expect(extractAccessIdentityFromUrl('?key=mykey456')).toBe('mykey456');
      expect(extractAccessIdentityFromUrl('?other=123')).toBeNull();
    });

    it('persists display identity without persisting its access key', () => {
      const identity = {
        worldId: '23b3a87f-8ca1-4d7f-9afd-c194b6b993af',
        displayName: 'Taylor',
        accessIdentity: 'a'.repeat(64),
        isIdentified: true,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      setStoredWorldIdentity(identity);
      const retrieved = getStoredWorldIdentity();
      expect(retrieved?.worldId).toBe(identity.worldId);
      expect(retrieved?.displayName).toBe(identity.displayName);
      expect(retrieved?.accessIdentity).toBeUndefined();
      expect(localStorage.getItem('peshie_world_identity')).not.toContain('accessIdentity');

      localStorage.setItem('peshie_access_token', identity.accessIdentity);
      clearStoredWorldIdentity();
      expect(getStoredWorldIdentity()).toBeNull();
      expect(getStoredAccessIdentity()).toBeNull();
    });
  });

  describe('Playful Identity Experience (Spec Section 11)', () => {
    it('presents the playful question instead of conventional login', async () => {
      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      // The onboarding prompt uses neutral, non-romantic language.
      expect(await screen.findByText(/what should we call you/i)).toBeDefined();

      // Verify it does NOT contain email/password fields
      expect(screen.queryByLabelText(/email/i)).toBeNull();
      expect(screen.queryByLabelText(/password/i)).toBeNull();

      // World content should be gated
      expect(screen.queryByTestId('world-content')).toBeNull();
    });

    it('identifies the user and confirms the private space is ready', async () => {
      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      const input = await screen.findByPlaceholderText(/your name.../i);
      fireEvent.change(input, { target: { value: 'Taylor' } });

      const submitButton = screen.getByRole('button', { name: /it's me/i });
      fireEvent.click(submitButton);

      // Verify specification transition phrase
      expect(await screen.findByText(/your space is ready/i)).toBeDefined();
      expect(await screen.findByText(/welcome, taylor/i)).toBeDefined();

      // World content should now be unlocked after transition completes
      const content = await screen.findByTestId('world-content', {}, { timeout: 3000 });
      expect(content).toBeDefined();

      // The recovery key is kept locally; the cached identity omits it.
      const stored = getStoredWorldIdentity();
      expect(stored).not.toBeNull();
      expect(stored?.displayName).toBe('Taylor');
      expect(stored?.isIdentified).toBe(true);
      expect(stored?.accessIdentity).toBeUndefined();
      expect(getStoredAccessIdentity()).toMatch(/^[a-f\d]{64}$/i);
    });

    it('unlocks only after the server validates the existing session', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => ({ identity: serverIdentity }),
        })) as unknown as typeof fetch
      );

      render(
        <WorldIdentityProvider>
          <PlayfulIdentityGate>
            <div data-testid="world-content">Her World Content</div>
          </PlayfulIdentityGate>
        </WorldIdentityProvider>
      );

      expect(await screen.findByTestId('world-content')).toBeDefined();
      expect(screen.queryByText(/what should we call you/i)).toBeNull();
    });
  });

  describe('New Phone Restoration (Spec Section 2)', () => {
    it('restores her world when providing an access token', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WorldIdentityProvider>{children}</WorldIdentityProvider>
      );

      const { result } = renderHook(() => useWorldIdentity(), { wrapper });

      await act(async () => {
        const success = await result.current.restoreWorldWithToken('a'.repeat(64));
        expect(success).toBe(true);
      });

      expect(result.current.isIdentified).toBe(true);
      expect(result.current.identity?.worldId).toBe(serverIdentity.worldId);
      expect(getStoredAccessIdentity()).toBe('a'.repeat(64));
    });
  });
});
