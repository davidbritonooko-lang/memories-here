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
  getStoredWorldIdentity,
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
  identifyWorld: (name: string) => Promise<WorldIdentity>;
  restoreWorldWithToken: (token: string) => Promise<boolean>;
  resetIdentity: () => void;
}

const WorldIdentityContext = createContext<WorldIdentityContextType | undefined>(
  undefined
);

function getInitialIdentity(): WorldIdentity | null {
  if (typeof window === 'undefined') return null;

  let activeToken = getStoredAccessIdentity();
  const currentIdentity = getStoredWorldIdentity();

  // Check URL parameter (?access=... or ?key=...)
  if (window.location.search) {
    const urlToken = extractAccessIdentityFromUrl(window.location.search);
    if (urlToken) {
      activeToken = urlToken;
      setStoredAccessIdentity(urlToken);
    }
  }

  if (currentIdentity && currentIdentity.isIdentified) {
    const updated: WorldIdentity = {
      ...currentIdentity,
      lastAccessedAt: new Date().toISOString(),
    };
    setStoredWorldIdentity(updated);
    return updated;
  }

  if (activeToken) {
    return {
      worldId: 'world_' + activeToken.substring(0, 12),
      displayName: '',
      accessIdentity: activeToken,
      isIdentified: false,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
  }

  return null;
}

export function WorldIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [identity, setIdentity] = useState<WorldIdentity | null>(getInitialIdentity);
  const [isLoading] = useState<boolean>(false);

  // Sanitize visible URL query params if a sensitive access key was used
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.search) return;

    const urlToken = extractAccessIdentityFromUrl(window.location.search);
    if (urlToken) {
      try {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('access');
        cleanUrl.searchParams.delete('key');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
      } catch {
        // Ignore
      }
    }
  }, []);

  const identifyWorld = useCallback(
    async (name: string): Promise<WorldIdentity> => {
      const trimmedName = name.trim();
      const existingToken =
        identity?.accessIdentity || getStoredAccessIdentity() || generateAccessIdentity();
      const worldId = identity?.worldId || 'world_' + existingToken.substring(0, 12);

      const newIdentity: WorldIdentity = {
        worldId,
        displayName: trimmedName,
        accessIdentity: existingToken,
        isIdentified: true,
        createdAt: identity?.createdAt || new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      setStoredAccessIdentity(existingToken);
      setStoredWorldIdentity(newIdentity);
      setIdentity(newIdentity);

      return newIdentity;
    },
    [identity]
  );

  const restoreWorldWithToken = useCallback(
    async (token: string): Promise<boolean> => {
      if (!token || token.trim().length === 0) return false;

      const cleanToken = token.trim();
      setStoredAccessIdentity(cleanToken);

      const stored = getStoredWorldIdentity();
      if (stored && stored.accessIdentity === cleanToken) {
        setIdentity(stored);
        return true;
      }

      const restored: WorldIdentity = {
        worldId: 'world_' + cleanToken.substring(0, 12),
        displayName: 'Peshie',
        accessIdentity: cleanToken,
        isIdentified: true,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      setStoredWorldIdentity(restored);
      setIdentity(restored);
      return true;
    },
    []
  );

  const resetIdentity = useCallback(() => {
    clearStoredWorldIdentity();
    setIdentity(null);
  }, []);

  const value = useMemo(
    () => ({
      identity,
      isIdentified: Boolean(identity?.isIdentified && identity.displayName),
      isLoading,
      identifyWorld,
      restoreWorldWithToken,
      resetIdentity,
    }),
    [identity, isLoading, identifyWorld, restoreWorldWithToken, resetIdentity]
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
