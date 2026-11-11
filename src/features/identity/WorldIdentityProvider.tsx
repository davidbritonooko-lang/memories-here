'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  WorldIdentity,
  setStoredWorldIdentity,
  getStoredAccessIdentity,
  setStoredAccessIdentity,
  clearStoredWorldIdentity,
  generateAccessIdentity,
  extractAccessIdentityFromUrl,
} from '@/lib/world/identity';

interface WorldIdentityContextType {
  identity: WorldIdentity | null;
  isIdentified: boolean;
  isLoading: boolean;
  identityError: string | null;
  identifyWorld: (name: string) => Promise<WorldIdentity>;
  restoreWorldWithToken: (token: string) => Promise<boolean>;
  resetIdentity: () => Promise<void>;
}

const WorldIdentityContext = createContext<WorldIdentityContextType | undefined>(
  undefined
);

interface IdentityResponse {
  identity: WorldIdentity;
}

async function readIdentityResponse(response: Response): Promise<WorldIdentity> {
  const body = (await response.json()) as IdentityResponse | { error?: string };
  if (!response.ok || !('identity' in body)) {
    throw new Error(
      'error' in body && body.error ? body.error : 'World identity could not be loaded.'
    );
  }
  return body.identity;
}

export function WorldIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [identity, setIdentity] = useState<WorldIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const restoreWorldWithToken = useCallback(
    async (token: string): Promise<boolean> => {
      const cleanToken = token.trim();
      if (!/^[a-f\d]{64}$/i.test(cleanToken)) return false;

      const response = await fetch('/api/identity', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', accessIdentity: cleanToken }),
      });

      if (response.status === 401) return false;
      const restored = await readIdentityResponse(response);
      setStoredAccessIdentity(cleanToken);
      setStoredWorldIdentity(restored);
      setIdentity(restored);
      setIdentityError(null);
      return true;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadIdentity = async () => {
      try {
        const urlToken = extractAccessIdentityFromUrl(window.location.search);
        if (urlToken) {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('access');
          cleanUrl.searchParams.delete('key');
          window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);

          if (await restoreWorldWithToken(urlToken)) return;
          clearStoredWorldIdentity();
        }

        const response = await fetch('/api/identity', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (response.ok) {
          const restored = await readIdentityResponse(response);
          if (!cancelled) {
            setIdentity(restored);
            setStoredWorldIdentity(restored);
            setIdentityError(null);
          }
          return;
        }
        if (response.status !== 401) {
          await readIdentityResponse(response);
        }

        const storedToken = getStoredAccessIdentity();
        if (storedToken && (await restoreWorldWithToken(storedToken))) return;
        clearStoredWorldIdentity();
      } catch (error) {
        if (!cancelled) {
          setIdentityError(
            error instanceof Error
              ? error.message
              : 'World identity could not be loaded. Check your connection and try again.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadIdentity();
    return () => {
      cancelled = true;
    };
  }, [restoreWorldWithToken]);

  const identifyWorld = useCallback(
    async (name: string): Promise<WorldIdentity> => {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length > 80) {
        throw new Error('Choose a name between 1 and 80 characters.');
      }
      const accessIdentity = generateAccessIdentity();
      const response = await fetch('/api/identity', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'identify',
          accessIdentity,
          displayName: trimmedName,
        }),
      });
      const newIdentity = await readIdentityResponse(response);

      setStoredAccessIdentity(accessIdentity);
      setStoredWorldIdentity(newIdentity);
      setIdentity(newIdentity);
      setIdentityError(null);
      return newIdentity;
    },
    []
  );

  const resetIdentity = useCallback(async () => {
    const response = await fetch('/api/identity', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    if (!response.ok) {
      throw new Error('Your private-world session could not be closed.');
    }
    clearStoredWorldIdentity();
    setIdentity(null);
  }, []);

  const value = useMemo(
    () => ({
      identity,
      isIdentified: Boolean(identity?.isIdentified && identity.displayName),
      isLoading,
      identityError,
      identifyWorld,
      restoreWorldWithToken,
      resetIdentity,
    }),
    [identity, isLoading, identityError, identifyWorld, restoreWorldWithToken, resetIdentity]
  );

  return (
    <WorldIdentityContext.Provider value={value}>
      {children}
    </WorldIdentityContext.Provider>
  );
}

export function useWorldIdentity(): WorldIdentityContextType {
  const context = useContext(WorldIdentityContext);
  if (!context) {
    throw new Error('useWorldIdentity must be used within a WorldIdentityProvider');
  }
  return context;
}
