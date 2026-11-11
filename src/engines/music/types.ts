/**
 * Global Music Engine Types & State Model
 * Specification Sections: 22, 23, 24, 25, 26
 */

import type { Track } from '@/types';

export type MusicPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

/**
 * Context string specifying who currently owns or requests music playback.
 * Examples: 'home', 'moment:123', 'peshtok:456', 'soundtrack:789'
 */
export type AudioContextOwner = string;

export interface AudioContextSnapshot {
  owner: AudioContextOwner;
  track: Track | null;
  position: number;
  volume: number;
  playbackState: MusicPlaybackState;
  timestamp: number;
}

export interface MusicEngineState {
  currentOwner: AudioContextOwner;
  currentTrack: Track | null;
  queue: Track[];
  position: number;
  duration: number;
  volume: number;
  playbackState: MusicPlaybackState;
  previousContext: AudioContextSnapshot | null;
  isDucked: boolean;
  duckedVolume: number;
  errorMessage: string | null;
}

export interface IMusicEngine {
  getState(): MusicEngineState;
  subscribe(listener: (state: MusicEngineState) => void): () => void;
  load(track: Track, audioUrl: string, autoPlay?: boolean): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  stop(): void;
  seek(positionSeconds: number): void;
  setVolume(volume: number): void;
  fadeIn(durationSeconds?: number): Promise<void>;
  fadeOut(durationSeconds?: number): Promise<void>;
  crossfade(newTrack: Track, newAudioUrl: string, durationSeconds?: number): Promise<void>;
  duck(duckRatio?: number): void;
  unduck(): void;
  queue(tracks: Track[]): void;
  clearQueue(): void;
  next(): Promise<void>;
  requestContext(owner: AudioContextOwner): boolean;
  releaseContext(owner: AudioContextOwner, restorePrevious?: boolean): Promise<void>;
  restoreContext(): Promise<void>;
}
