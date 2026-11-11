/**
 * File Validation Utilities
 * Client-side validation before attempting Supabase Storage uploads.
 * Specification Sections: 16, 17, 20, 48 (MIME validation, file-size validation)
 */

import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_TYPE_LABELS,
  type StorageBucket,
} from './constants';

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// MIME type check
// ---------------------------------------------------------------------------

const MIME_MAP: Record<StorageBucket, readonly string[]> = {
  photos: ALLOWED_MIME_TYPES.PHOTO,
  videos: ALLOWED_MIME_TYPES.VIDEO,
  audio: ALLOWED_MIME_TYPES.AUDIO,
  thumbnails: ALLOWED_MIME_TYPES.THUMBNAIL,
};

/**
 * Returns true when `mimeType` is accepted by the given bucket.
 */
export function isAllowedMimeType(bucket: StorageBucket, mimeType: string): boolean {
  return (MIME_MAP[bucket] as readonly string[]).includes(mimeType.toLowerCase());
}

// ---------------------------------------------------------------------------
// File size check
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<StorageBucket, number> = {
  photos: MAX_FILE_SIZE.PHOTO,
  videos: MAX_FILE_SIZE.VIDEO,
  audio: MAX_FILE_SIZE.AUDIO,
  thumbnails: MAX_FILE_SIZE.THUMBNAIL,
};

/**
 * Returns true when `sizeBytes` does not exceed the bucket limit.
 */
export function isWithinSizeLimit(bucket: StorageBucket, sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= SIZE_MAP[bucket];
}

// ---------------------------------------------------------------------------
// Combined validation
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates a file against a bucket's MIME and size rules.
 * Returns a human-friendly error when validation fails —
 * never exposes raw technical details (Spec Section 46).
 */
export function validateFile(
  bucket: StorageBucket,
  file: { type: string; size: number; name?: string },
): ValidationResult {
  const label = FILE_TYPE_LABELS[bucket];

  if (!file.type) {
    return { valid: false, error: `This ${label} doesn't seem to be a supported file.` };
  }

  if (!isAllowedMimeType(bucket, file.type)) {
    return {
      valid: false,
      error: `That file type isn't supported for ${label}s. Try a different format.`,
    };
  }

  if (!isWithinSizeLimit(bucket, file.size)) {
    const maxLabel = formatBytes(SIZE_MAP[bucket]);
    return {
      valid: false,
      error: `This ${label} is too large. The limit is ${maxLabel}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates multiple files at once.
 * Returns the first failing result, or a passing result.
 */
export function validateFiles(
  bucket: StorageBucket,
  files: { type: string; size: number; name?: string }[],
): ValidationResult {
  for (const file of files) {
    const result = validateFile(bucket, file);
    if (!result.valid) return result;
  }
  return { valid: true };
}
