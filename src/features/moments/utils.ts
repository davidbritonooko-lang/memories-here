/**
 * Moments Feature — Formatting & Helper Utilities
 * Specification Sections: 14, 15, 18, 19
 */

import type { Photo, Video, Track } from '@/types';

/** Shape returned by momentsRepo.listByWorld with nested joins */
export interface MomentWithMedia {
  id: string;
  world_id: string;
  title: string;
  date: string;
  location_id?: string | null;
  location?: { id: string; name: string } | null;
  is_draft: boolean;
  keep_offline?: boolean;
  presentation_settings?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  moment_photos?: Array<{
    id: string;
    sort_order: number;
    presentation_settings?: Record<string, unknown> | null;
    photo?: Photo | null;
  }>;
  moment_videos?: Array<{
    id: string;
    sort_order: number;
    presentation_settings?: Record<string, unknown> | null;
    video?: Video | null;
  }>;
  moment_tracks?: Array<{
    id: string;
    sort_order: number;
    track?: Track | null;
  }>;
}

/**
 * Formats a date string to a human-friendly display.
 * Examples: "November 3, 2026", "Jan 15, 2025"
 */
export function formatMomentDate(dateStr: string, style: 'long' | 'short' = 'long'): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (style === 'short') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns a relative time label like "2 days ago", "Just now", "3 months ago".
 */
export function relativeTimeLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return '';
  }
}

/**
 * Returns a compact media summary badge label.
 * e.g. "3 photos · 1 video" or "5 photos"
 */
export function mediaSummary(moment: MomentWithMedia): string {
  const parts: string[] = [];
  const photoCount = moment.moment_photos?.length ?? 0;
  const videoCount = moment.moment_videos?.length ?? 0;
  const trackCount = moment.moment_tracks?.length ?? 0;

  if (photoCount > 0) parts.push(`${photoCount} photo${photoCount !== 1 ? 's' : ''}`);
  if (videoCount > 0) parts.push(`${videoCount} video${videoCount !== 1 ? 's' : ''}`);
  if (trackCount > 0) parts.push(`${trackCount} track${trackCount !== 1 ? 's' : ''}`);

  return parts.join(' · ') || 'Empty moment';
}

/**
 * Returns total media count for a moment.
 */
export function totalMediaCount(moment: MomentWithMedia): number {
  return (
    (moment.moment_photos?.length ?? 0) +
    (moment.moment_videos?.length ?? 0) +
    (moment.moment_tracks?.length ?? 0)
  );
}

/**
 * Extracts the hero thumbnail storage path from a moment.
 * Priority: first photo > first video thumbnail > null.
 */
export function getHeroThumbnail(moment: MomentWithMedia): string | null {
  const sortedPhotos = [...(moment.moment_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  if (sortedPhotos.length > 0 && sortedPhotos[0].photo?.storage_path) {
    return sortedPhotos[0].photo.storage_path;
  }

  const sortedVideos = [...(moment.moment_videos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  if (sortedVideos.length > 0) {
    const firstVideo = sortedVideos[0].video;
    if (firstVideo?.thumbnail_path) return firstVideo.thumbnail_path;
    if (firstVideo?.storage_path) return firstVideo.storage_path;
  }

  return null;
}

/**
 * Sorts moments by date descending (newest first).
 */
export function sortMomentsByDate(moments: MomentWithMedia[]): MomentWithMedia[] {
  return [...moments].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Returns today's date as YYYY-MM-DD for date input defaults.
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
