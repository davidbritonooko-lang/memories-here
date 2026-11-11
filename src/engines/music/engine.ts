/**
 * Global Music Engine Implementation
 * Specification Sections: 22 (Global Music Engine), 23 (Music Ownership),
 * 24 (Moment Transition), 25 (Moment Exit), 26 (Video Audio Ducking)
 *
 * Utilizes Web Audio API with gain automation for smooth crossfades and ducking.
 */

import type { Track } from '@/types';
import { getSignedUrl } from '@/lib/storage/client';
import type {
  IMusicEngine,
  MusicEngineState,
  AudioContextOwner,
} from './types';

export class MusicEngine implements IMusicEngine {
  private state: MusicEngineState;
  private listeners: Set<(state: MusicEngineState) => void> = new Set();

  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private duckGainNode: GainNode | null = null;

  private currentAudioUrl: string | null = null;

  constructor(
    private readonly resolveTrackUrl: (track: Track) => Promise<string> = async (track) => {
      if (/^(https?:|blob:)/i.test(track.storage_path)) return track.storage_path;
      const result = await getSignedUrl('audio', track.storage_path);
      if (result.error || !result.url) {
        throw new Error(result.error?.userMessage || 'The next track could not be loaded.');
      }
      return result.url;
    }
  ) {
    this.state = {
      currentOwner: 'home',
      currentTrack: null,
      queue: [],
      position: 0,
      duration: 0,
      volume: 0.8,
      playbackState: 'idle',
      previousContext: null,
      isDucked: false,
      duckedVolume: 0.2, // ~20% of master level during video playback (Spec Section 26)
      errorMessage: null,
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public getState(): MusicEngineState {
    return { ...this.state };
  }

  public subscribe(listener: (state: MusicEngineState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private initWebAudio() {
    if (typeof window === 'undefined') return;

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';

      this.audioElement.ontimeupdate = () => {
        if (this.audioElement) {
          this.state.position = this.audioElement.currentTime;
          this.emit();
        }
      };

      this.audioElement.ondurationchange = () => {
        if (this.audioElement) {
          this.state.duration = this.audioElement.duration || 0;
          this.emit();
        }
      };

      this.audioElement.onended = () => {
        void this.next();
      };

      this.audioElement.onerror = () => {
        this.state.playbackState = 'error';
        this.state.errorMessage = 'Playback encountered an issue.';
        this.emit();
      };
    }

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
          this.gainNode = this.audioCtx.createGain();
          this.gainNode.gain.setValueAtTime(this.state.volume, this.audioCtx.currentTime);

          this.duckGainNode = this.audioCtx.createGain();
          this.duckGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

          this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
          this.sourceNode.connect(this.duckGainNode);
          this.duckGainNode.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);
        } catch {
          // Fallback to plain HTMLAudioElement if Web Audio fails
        }
      }
    }
  }

  public async load(track: Track, audioUrl: string, autoPlay = true): Promise<void> {
    this.initWebAudio();

    this.state.currentTrack = track;
    this.state.playbackState = 'loading';
    this.state.errorMessage = null;
    this.currentAudioUrl = audioUrl;
    this.emit();

    if (this.audioElement) {
      this.audioElement.src = audioUrl;
      this.audioElement.load();
    }

    if (autoPlay) {
      await this.play();
    } else {
      this.state.playbackState = 'paused';
      this.emit();
    }
  }

  public async play(): Promise<void> {
    this.initWebAudio();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {
        // Safe catch for user interaction policy
      }
    }

    if (this.audioElement) {
      try {
        await this.audioElement.play();
        this.state.playbackState = 'playing';
        this.emit();
      } catch (err: unknown) {
        this.state.playbackState = 'error';
        this.state.errorMessage =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Touch or click to allow audio playback.'
            : "Couldn't start playback right now.";
        this.emit();
      }
    } else {
      this.state.playbackState = 'playing';
      this.emit();
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.state.playbackState = 'paused';
    this.emit();
  }

  public async resume(): Promise<void> {
    await this.play();
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.state.playbackState = 'stopped';
    this.state.position = 0;
    this.emit();
  }

  public seek(positionSeconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, positionSeconds);
    }
    this.state.position = positionSeconds;
    this.emit();
  }

  public setVolume(volume: number): void {
    const clamped = Math.min(1.0, Math.max(0.0, volume));
    this.state.volume = clamped;

    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.gainNode.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    } else if (this.audioElement) {
      this.audioElement.volume = clamped;
    }

    this.emit();
  }

  public async fadeIn(durationSeconds = 1.0): Promise<void> {
    const targetVolume = this.state.volume;
    if (this.gainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, targetVolume), now + durationSeconds);
    }
    await this.play();
  }

  public async fadeOut(durationSeconds = 1.0): Promise<void> {
    if (this.gainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      const currentGain = this.gainNode.gain.value;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(Math.max(0.001, currentGain), now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
    }
    await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
    this.pause();
  }

  public async crossfade(newTrack: Track, newAudioUrl: string, durationSeconds = 1.2): Promise<void> {
    await this.fadeOut(durationSeconds / 2);
    await this.load(newTrack, newAudioUrl, false);
    await this.fadeIn(durationSeconds / 2);
  }

  /**
   * Ducks background music volume around video audio to ~15-25% (Spec Section 26).
   */
  public duck(duckRatio = 0.2): void {
    this.state.isDucked = true;
    this.state.duckedVolume = duckRatio;

    if (this.duckGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.duckGainNode.gain.cancelScheduledValues(now);
      this.duckGainNode.gain.setValueAtTime(this.duckGainNode.gain.value, now);
      this.duckGainNode.gain.linearRampToValueAtTime(duckRatio, now + 0.3);
    }
    this.emit();
  }

  /**
   * Smoothly restores background music volume after video ends (Spec Section 26).
   */
  public unduck(): void {
    this.state.isDucked = false;

    if (this.duckGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.duckGainNode.gain.cancelScheduledValues(now);
      this.duckGainNode.gain.setValueAtTime(this.duckGainNode.gain.value, now);
      this.duckGainNode.gain.linearRampToValueAtTime(1.0, now + 0.4);
    }
    this.emit();
  }

  public queue(tracks: Track[]): void {
    this.state.queue = [...this.state.queue, ...tracks];
    this.emit();
  }

  public clearQueue(): void {
    this.state.queue = [];
    this.emit();
  }

  public async next(): Promise<void> {
    if (this.state.queue.length === 0) {
      this.stop();
      return;
    }
    const [nextTrack, ...remaining] = this.state.queue;
    try {
      const audioUrl = await this.resolveTrackUrl(nextTrack);
      this.state.queue = remaining;
      await this.load(nextTrack, audioUrl, true);
    } catch (error) {
      this.state.playbackState = 'error';
      this.state.errorMessage =
        error instanceof Error ? error.message : 'The next track could not be loaded.';
      this.emit();
    }
  }

  /**
   * Request ownership for a context (e.g. 'moment:123', 'home', 'peshtok:456')
   * Captures snapshot of previous context before transitioning (Spec Section 23, 24).
   */
  public requestContext(owner: AudioContextOwner): boolean {
    if (this.state.currentOwner === owner) {
      return true;
    }

    // Capture snapshot of previous owner state
    this.state.previousContext = {
      owner: this.state.currentOwner,
      track: this.state.currentTrack,
      position: this.state.position,
      volume: this.state.volume,
      playbackState: this.state.playbackState,
      timestamp: Date.now(),
    };

    this.state.currentOwner = owner;
    this.emit();
    return true;
  }

  /**
   * Releases current ownership, optionally restoring the previously active context (Spec Section 25).
   */
  public async releaseContext(owner: AudioContextOwner, restorePrevious = true): Promise<void> {
    if (this.state.currentOwner !== owner) {
      return;
    }

    if (restorePrevious && this.state.previousContext) {
      await this.restoreContext();
    } else {
      this.state.currentOwner = 'home';
      this.emit();
    }
  }

  /**
   * Restores previous audio context, smoothly fading back into previous track/position (Spec Section 25).
   */
  public async restoreContext(): Promise<void> {
    const prev = this.state.previousContext;
    if (!prev) return;

    this.state.currentOwner = prev.owner;
    this.state.previousContext = null;

    if (prev.track && prev.playbackState === 'playing') {
      this.state.currentTrack = prev.track;
      this.seek(prev.position);
      await this.fadeIn(1.0);
    } else {
      this.emit();
    }
  }
}

// Singleton global engine instance
export const musicEngine = new MusicEngine();
