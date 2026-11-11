'use client';

import React from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Disc } from 'lucide-react';
import { useMusic } from '@/engines/music';
import { formatTrackTitle, formatDuration } from './utils';

export function PlayerBar() {
  const { engine, state } = useMusic();
  const { currentTrack, playbackState, position, duration, volume, isDucked } = state;

  if (!currentTrack) {
    return null;
  }

  const isPlaying = playbackState === 'playing';
  const displayTitle = formatTrackTitle(currentTrack.track_number, currentTrack.title);

  const handleTogglePlay = () => {
    if (isPlaying) {
      engine.pause();
    } else {
      engine.resume();
    }
  };

  const handleNext = () => {
    engine.next();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    engine.seek(val);
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      engine.setVolume(0);
    } else {
      engine.setVolume(0.8);
    }
  };

  return (
    <div
      role="region"
      aria-label="Soundtrack Player Controls"
      className="fixed bottom-[4.5rem] inset-x-3 md:inset-x-auto md:right-6 md:w-96 z-40 bg-surface/95 backdrop-blur-md border border-border/80 shadow-xl rounded-2xl p-3.5 flex flex-col gap-2 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 text-accent shrink-0 ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '8s' }}
          >
            <Disc className="w-5 h-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-primary-text truncate">
              {displayTitle}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-text">
              <span>{formatDuration(position)}</span>
              <span>/</span>
              <span>{formatDuration(duration || currentTrack.duration_seconds)}</span>
              {isDucked && (
                <span className="text-accent font-medium">• Ducked</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            onClick={handleVolumeToggle}
            className="p-2 text-secondary-text hover:text-primary-text transition-colors rounded-lg"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={handleTogglePlay}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-accent text-white shadow-sm active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            aria-label="Next track"
            onClick={handleNext}
            className="p-2 text-secondary-text hover:text-primary-text transition-colors rounded-lg"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress track slider */}
      <div className="w-full flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={duration || currentTrack.duration_seconds || 100}
          value={position}
          onChange={handleSeek}
          aria-label="Track progress"
          className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>
      {state.errorMessage && (
        <p role="status" className="text-xs text-red-500">
          {state.errorMessage}
        </p>
      )}
    </div>
  );
}
