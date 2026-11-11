/**
 * Soundtrack Library Helper Functions
 * Auto-numbering, duration formatters, and queue handlers.
 * Specification Section: 20
 */

import type { Track } from '@/types';

/**
 * Formats track numbering automatically as "TRACK 01", "TRACK 02", etc.
 * Spec Section 20: "Track display naming: TRACK 01, TRACK 02... Do not require manual track numbering."
 */
export function formatTrackTitle(trackNumber: number, customTitle?: string): string {
  const padded = String(trackNumber).padStart(2, '0');
  if (customTitle && customTitle !== `TRACK ${padded}` && customTitle.trim() !== '') {
    return `TRACK ${padded} — ${customTitle}`;
  }
  return `TRACK ${padded}`;
}

/**
 * Formats duration in seconds to "mm:ss" or "hh:mm:ss"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Sorts tracks in ascending order by their assigned track_number.
 */
export function sortTracksByNumber(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => a.track_number - b.track_number);
}
