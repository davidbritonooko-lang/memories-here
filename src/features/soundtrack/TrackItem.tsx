'use client';

import React from 'react';
import { Play, Pause, Volume2, Archive } from 'lucide-react';
import type { Track } from '@/types';
import { formatTrackTitle, formatDuration } from './utils';

export interface TrackItemProps {
  track: Track;
  isPlaying?: boolean;
  isActive?: boolean;
  onPlay: (track: Track) => void;
  onPause: () => void;
  onArchive?: (track: Track) => void;
}

export function TrackItem({
  track,
  isPlaying = false,
  isActive = false,
  onPlay,
  onPause,
  onArchive,
}: TrackItemProps) {
  const displayTitle = formatTrackTitle(track.track_number, track.title);

  return (
    <div
      role="listitem"
      className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 border ${
        isActive
          ? 'bg-accent/10 border-accent/30 shadow-sm'
          : 'bg-surface border-border hover:border-accent/30 hover:bg-elevated/50'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          aria-label={isActive && isPlaying ? `Pause ${displayTitle}` : `Play ${displayTitle}`}
          onClick={() => {
            if (isActive && isPlaying) {
              onPause();
            } else {
              onPlay(track);
            }
          }}
          className={`flex items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-95 shrink-0 ${
            isActive && isPlaying
              ? 'bg-accent text-white shadow-md'
              : 'bg-elevated border border-border text-primary-text hover:bg-accent/20 hover:text-accent'
          }`}
        >
          {isActive && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs uppercase tracking-wider ${
                isActive ? 'text-accent font-semibold' : 'text-muted-text'
              }`}
            >
              #{String(track.track_number).padStart(2, '0')}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-semibold text-accent px-1.5 py-0.5 rounded-full bg-accent/15">
                <Volume2 className="w-2.5 h-2.5" />
                Active
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-primary-text truncate">
            {displayTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-xs text-muted-text tabular-nums">
          {formatDuration(track.duration_seconds)}
        </span>

        {onArchive && (
          <button
            type="button"
            aria-label={`Archive ${displayTitle}`}
            onClick={(e) => {
              e.stopPropagation();
              onArchive(track);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-muted-text hover:text-red-500 rounded-lg transition-all"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
