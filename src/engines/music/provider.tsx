'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { musicEngine } from './engine';
import type { MusicEngineState, IMusicEngine } from './types';

interface MusicContextValue {
  engine: IMusicEngine;
  state: MusicEngineState;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MusicEngineState>(() => musicEngine.getState());

  useEffect(() => {
    const unsubscribe = musicEngine.subscribe((nextState) => {
      setState(nextState);
    });
    return unsubscribe;
  }, []);

  return (
    <MusicContext.Provider value={{ engine: musicEngine, state }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used within a MusicProvider.');
  }
  return ctx;
}
