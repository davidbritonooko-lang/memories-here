/**
 * Storage Constants
 * Bucket names, size limits, and allowed MIME types for Supabase Storage.
 * Must stay in sync with supabase/migrations/002_storage_buckets.sql
 */

// ---------------------------------------------------------------------------
// Bucket identifiers
// ---------------------------------------------------------------------------

export const STORAGE_BUCKETS = {
  PHOTOS: 'photos',
  VIDEOS: 'videos',
  AUDIO: 'audio',
  THUMBNAILS: 'thumbnails',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// ---------------------------------------------------------------------------
// File size limits (bytes) — mirrors SQL file_size_limit values
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = {
  PHOTO: 50 * 1024 * 1024,       // 50 MB
  VIDEO: 500 * 1024 * 1024,      // 500 MB
  AUDIO: 100 * 1024 * 1024,      // 100 MB
  THUMBNAIL: 5 * 1024 * 1024,    // 5 MB
} as const;

// ---------------------------------------------------------------------------
// Allowed MIME types — mirrors SQL allowed_mime_types arrays
// ---------------------------------------------------------------------------

export const ALLOWED_MIME_TYPES = {
  PHOTO: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
  ] as const,

  VIDEO: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
  ] as const,

  AUDIO: [
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ] as const,

  THUMBNAIL: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const,
} as const;

// ---------------------------------------------------------------------------
// Human-readable file type labels for error messages
// ---------------------------------------------------------------------------

export const FILE_TYPE_LABELS: Record<StorageBucket, string> = {
  photos: 'photo',
  videos: 'video',
  audio: 'audio track',
  thumbnails: 'thumbnail',
};

// ---------------------------------------------------------------------------
// Storage path helpers
// ---------------------------------------------------------------------------

/**
 * Builds a scoped storage path: `{worldId}/{mediaType}/{filename}`
 * Ensures files are organized per-world for easy RLS scoping later.
 */
export function buildStoragePath(
  worldId: string,
  mediaType: 'photos' | 'videos' | 'audio' | 'thumbnails',
  filename: string,
): string {
  // Sanitise filename: strip directory traversal, path separators, collapse whitespace
  const safe = filename
    .replace(/\.\.+/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\w.\-]/g, '')
    .replace(/^_+/, '');

  return `${worldId}/${mediaType}/${Date.now()}_${safe}`;
}
