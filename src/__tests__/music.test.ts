import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MusicEngine } from '@/engines/music/engine';
import type { Track } from '@/types';

const mockTrack1: Track = {
  id: 'track-1',
  world_id: 'world-1',
  track_number: 1,
  title: 'TRACK 01',
  storage_path: 'world-1/audio/track-1.mp3',
  duration_seconds: 180,
  mime_type: 'audio/mpeg',
  file_size: 5000000,
  created_at: new Date().toISOString(),
};

const mockTrack2: Track = {
  id: 'track-2',
  world_id: 'world-1',
  track_number: 2,
  title: 'TRACK 02',
  storage_path: 'world-1/audio/track-2.mp3',
  duration_seconds: 210,
  mime_type: 'audio/mpeg',
  file_size: 6000000,
  created_at: new Date().toISOString(),
};

describe('Phase 8: Music Engine Acceptance Tests', () => {
  let engine: MusicEngine;

  beforeEach(() => {
    engine = new MusicEngine(async (track) => `https://audio.example/${track.id}`);
  });

  describe('Global Music Engine State Model (Spec Section 22)', () => {
    it('initializes in idle state with default volume and home context', () => {
      const state = engine.getState();
      expect(state.currentOwner).toBe('home');
      expect(state.playbackState).toBe('idle');
      expect(state.volume).toBe(0.8);
      expect(state.currentTrack).toBeNull();
      expect(state.isDucked).toBe(false);
      expect(state.previousContext).toBeNull();
    });

    it('subscribes to state updates and receives initial state', () => {
      let receivedState = null;
      const unsubscribe = engine.subscribe((s) => {
        receivedState = s;
      });

      expect(receivedState).toBeDefined();
      expect((receivedState as unknown as { currentOwner: string }).currentOwner).toBe('home');
      unsubscribe();
    });

    it('clamps volume between 0.0 and 1.0', () => {
      engine.setVolume(1.5);
      expect(engine.getState().volume).toBe(1.0);

      engine.setVolume(-0.5);
      expect(engine.getState().volume).toBe(0.0);

      engine.setVolume(0.65);
      expect(engine.getState().volume).toBe(0.65);
    });
  });

  describe('Music Ownership & Audio Context Transfers (Spec Section 23, 24, 25)', () => {
    it('requestContext captures a snapshot of the previous context', () => {
      // Simulate active track playing on Home
      engine.seek(45);
      expect(engine.getState().currentOwner).toBe('home');

      // Moment requests ownership
      const granted = engine.requestContext('moment:mom-123');
      expect(granted).toBe(true);

      const state = engine.getState();
      expect(state.currentOwner).toBe('moment:mom-123');
      expect(state.previousContext).toBeDefined();
      expect(state.previousContext?.owner).toBe('home');
      expect(state.previousContext?.position).toBe(45);
    });

    it('releaseContext restores previous audio context', async () => {
      // Home is playing track 1 at position 30
      engine.requestContext('home');
      engine.seek(30);

      // Enter Moment
      engine.requestContext('moment:mom-456');
      expect(engine.getState().currentOwner).toBe('moment:mom-456');

      // Leave Moment -> restores previous context
      await engine.releaseContext('moment:mom-456', true);
      const state = engine.getState();
      expect(state.currentOwner).toBe('home');
      expect(state.previousContext).toBeNull();
    });

    it('reloads the saved track and restores its position when returning to a previous context', async () => {
      const audio = {
        currentTime: 0,
        duration: 180,
        volume: 1,
        preload: '',
        src: '',
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        ontimeupdate: null,
        ondurationchange: null,
        onended: null,
        onerror: null,
      } as unknown as HTMLAudioElement;
      vi.stubGlobal('Audio', vi.fn(() => audio));

      const resolveTrackUrl = vi.fn(async (track: Track) => `https://audio.example/${track.id}`);
      const contextEngine = new MusicEngine(resolveTrackUrl);

      await contextEngine.load(mockTrack1, 'https://audio.example/track-1', false);
      await contextEngine.play();
      contextEngine.seek(32);
      contextEngine.requestContext('moment:mom-restore');
      await contextEngine.load(mockTrack2, 'https://audio.example/track-2', false);

      await contextEngine.releaseContext('moment:mom-restore', true);

      expect(resolveTrackUrl).toHaveBeenCalledWith(mockTrack1);
      expect(audio.src).toBe('https://audio.example/track-1');
      expect(audio.currentTime).toBe(32);
      expect(audio.play).toHaveBeenCalledTimes(2);
      expect(contextEngine.getState().currentTrack?.id).toBe(mockTrack1.id);
      expect(contextEngine.getState().playbackState).toBe('playing');
    });

    it('does not allow arbitrary context release from non-owners', async () => {
      engine.requestContext('moment:mom-1');
      await engine.releaseContext('peshtok:feed'); // Wrong owner
      expect(engine.getState().currentOwner).toBe('moment:mom-1');
    });
  });

  describe('Video Audio Ducking (Spec Section 26)', () => {
    it('duck reduces volume to ~20% and sets isDucked flag', () => {
      engine.duck(0.2);
      const state = engine.getState();
      expect(state.isDucked).toBe(true);
      expect(state.duckedVolume).toBe(0.2);
    });

    it('unduck smoothly restores master volume', () => {
      engine.duck(0.15);
      expect(engine.getState().isDucked).toBe(true);

      engine.unduck();
      expect(engine.getState().isDucked).toBe(false);
    });
  });

  describe('Queue and Sequential Playback (Spec Section 20, 21)', () => {
    it('resolves and loads the queued track URL before advancing', async () => {
      const resolveTrackUrl = vi.fn(async (track: Track) => `https://audio.example/${track.id}`);
      const queueEngine = new MusicEngine(resolveTrackUrl);
      queueEngine.queue([mockTrack1]);

      await queueEngine.next();

      expect(resolveTrackUrl).toHaveBeenCalledWith(mockTrack1);
      expect(queueEngine.getState().currentTrack?.id).toBe(mockTrack1.id);
      expect(queueEngine.getState().queue).toHaveLength(0);
    });

    it('enqueues tracks and handles next track transition', async () => {
      engine.queue([mockTrack1, mockTrack2]);
      expect(engine.getState().queue.length).toBe(2);

      await engine.next();
      const state = engine.getState();
      expect(state.currentTrack?.id).toBe('track-1');
      expect(state.queue.length).toBe(1);

      await engine.next();
      expect(engine.getState().currentTrack?.id).toBe('track-2');
      expect(engine.getState().queue.length).toBe(0);
    });

    it('clearQueue empties remaining queue', () => {
      engine.queue([mockTrack1, mockTrack2]);
      expect(engine.getState().queue.length).toBe(2);
      engine.clearQueue();
      expect(engine.getState().queue.length).toBe(0);
    });
  });
});
