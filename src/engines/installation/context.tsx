'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  getInstallationEngine,
  type InstallationState,
} from './engine';

export interface InstallationContextValue extends InstallationState {
  promptInstall: () => Promise<boolean>;
}

const InstallationContext = createContext<InstallationContextValue | null>(null);

export function InstallationProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => getInstallationEngine(), []);
  const [state, setState] = useState<InstallationState>(() => engine.getState());

  useEffect(() => {
    return engine.subscribe(setState);
  }, [engine]);

  const value = useMemo(
    () => ({
      ...state,
      promptInstall: () => engine.promptInstall(),
    }),
    [state, engine]
  );

  return (
    <InstallationContext.Provider value={value}>
      {children}
    </InstallationContext.Provider>
  );
}

export function useInstallation(): InstallationContextValue {
  const ctx = useContext(InstallationContext);
  if (!ctx) {
    // Return safe default when not wrapped in provider
    return {
      isStandalone: false,
      isInstallable: false,
      isInstalled: false,
      platform: 'unknown',
      promptInstall: async () => false,
    };
  }
  return ctx;
}
