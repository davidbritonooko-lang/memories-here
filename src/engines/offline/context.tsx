'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getOfflineEngine, type OfflineStorageState } from './engine';

export interface OfflineContextValue extends OfflineStorageState {
  usedMB: number;
  quotaMB: number;
  clearCache: () => Promise<boolean>;
  refreshEstimate: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => getOfflineEngine(), []);
  const [state, setState] = useState<OfflineStorageState>(() => engine.getState());

  useEffect(() => {
    return engine.subscribe(setState);
  }, [engine]);

  const value = useMemo(
    () => ({
      ...state,
      usedMB: Number((state.usedBytes / (1024 * 1024)).toFixed(1)),
      quotaMB: Number((state.quotaBytes / (1024 * 1024)).toFixed(0)),
      clearCache: () => engine.clearCache(),
      refreshEstimate: async () => {
        await engine.estimateStorage();
      },
    }),
    [state, engine]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    return {
      isOnline: true,
      usedBytes: 0,
      quotaBytes: 0,
      usedMB: 0,
      quotaMB: 0,
      clearCache: async () => false,
      refreshEstimate: async () => {},
    };
  }
  return ctx;
}
