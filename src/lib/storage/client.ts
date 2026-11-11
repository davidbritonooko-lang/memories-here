/**
 * Supabase Storage Client Utilities
 * Upload, download, delete, and URL generation for private storage buckets.
 * Specification Sections: 4, 16, 17, 20, 35, 48
 *
 * All operations use the anon-key client — NEVER the service-role key.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { type StorageBucket, buildStoragePath } from './constants';
import { validateFile, type ValidationResult } from './validation';
import { getCachedMediaUrl, type OfflineMediaBucket } from '@/engines/offline/engine';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface UploadResult {
  /** Storage path of the uploaded file (use for DB storage_path columns) */
  path: string;
  /** Full public/signed URL to access the file */
  url: string;
}

export interface StorageError {
  message: string;
  /** User-facing message safe to display (Spec Section 46) */
  userMessage: string;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Uploads a file to a Supabase Storage bucket.
 *
 * 1. Validates MIME type and file size client-side.
 * 2. Builds a world-scoped path: `{worldId}/{bucket}/{timestamp}_{filename}`.
 * 3. Uploads via the anon-key client.
 * 4. Returns the storage path and a signed URL.
 *
 * @throws Never — returns error object instead (Spec Section 46).
 */
export async function uploadFile(
  bucket: StorageBucket,
  worldId: string,
  file: File,
): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  // Client-side validation
  const validation: ValidationResult = validateFile(bucket, file);
  if (!validation.valid) {
    return {
      data: null,
      error: {
        message: validation.error || 'Validation failed',
        userMessage: validation.error || "That file couldn't be uploaded.",
      },
    };
  }

  const storagePath = buildStoragePath(worldId, bucket, file.name);
  const supabase = getSupabaseBrowserClient();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return {
      data: null,
      error: {
        message: uploadError.message,
        userMessage: "That upload didn't finish. Try again.",
      },
    };
  }

  // Generate a signed URL (1 hour)
  const { data: urlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);

  if (signedUrlError || !urlData?.signedUrl) {
    let cleanupError = '';
    try {
      const cleanupResult = await supabase.storage.from(bucket).remove([storagePath]);
      if (cleanupResult.error) {
        cleanupError = ` The uploaded file could not be removed: ${cleanupResult.error.message}`;
      }
    } catch (error) {
      cleanupError = ` The uploaded file could not be removed: ${
        error instanceof Error ? error.message : 'unknown cleanup error'
      }`;
    }
    return {
      data: null,
      error: {
        message: signedUrlError?.message || 'No signed URL was returned.',
        userMessage: `The upload completed, but its private link could not be created.${cleanupError}`,
      },
    };
  }

  return {
    data: {
      path: storagePath,
      url: urlData.signedUrl,
    },
    error: null,
  };
}

/**
 * Uploads multiple files to the same bucket.
 * Returns results in the same order as the input files.
 */
export async function uploadFiles(
  bucket: StorageBucket,
  worldId: string,
  files: File[],
): Promise<{ results: { data: UploadResult | null; error: StorageError | null }[] }> {
  const results = await Promise.all(
    files.map((file) => uploadFile(bucket, worldId, file)),
  );
  return { results };
}

// ---------------------------------------------------------------------------
// Download / URL
// ---------------------------------------------------------------------------

/**
 * Creates a signed download URL for a stored file.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<{ url: string | null; error: StorageError | null }> {
  const worldId = storagePath.split('/')[0];

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return { url: data.signedUrl, error: null };
    }

    const cachedUrl = await getCachedMediaUrl(
      worldId,
      bucket as OfflineMediaBucket,
      storagePath
    );
    if (cachedUrl) return { url: cachedUrl, error: null };

    return {
      url: null,
      error: {
        message: error?.message || 'No signed URL was returned.',
        userMessage: "Couldn't load this file right now. Try again.",
      },
    };
  } catch (cause) {
    const cachedUrl = await getCachedMediaUrl(
      worldId,
      bucket as OfflineMediaBucket,
      storagePath
    );
    if (cachedUrl) return { url: cachedUrl, error: null };

    return {
      url: null,
      error: {
        message: cause instanceof Error ? cause.message : 'Storage request failed.',
        userMessage: "Couldn't load this file right now. Try again.",
      },
    };
  }
}
/**
 * Creates signed URLs for multiple storage paths in a single request.
 */
export async function getSignedUrls(
  bucket: StorageBucket,
  storagePaths: string[],
  expiresInSeconds = 3600,
): Promise<{ urls: (string | null)[]; error: StorageError | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(storagePaths, expiresInSeconds);

  if (error) {
    return {
      urls: [],
      error: {
        message: error.message,
        userMessage: "Couldn't load some files. Try again.",
      },
    };
  }

  return {
    urls: (data || []).map((item) => item.signedUrl),
    error: null,
  };
}

/**
 * Downloads a file from storage as a Blob.
 */
export async function downloadFile(
  bucket: StorageBucket,
  storagePath: string,
): Promise<{ data: Blob | null; error: StorageError | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        userMessage: "This file couldn't be downloaded. Try again.",
      },
    };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Deletes a single file from storage.
 */
export async function deleteFile(
  bucket: StorageBucket,
  storagePath: string,
): Promise<{ error: StorageError | null }> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([storagePath]);

  if (error) {
    return {
      error: {
        message: error.message,
        userMessage: "Couldn't remove this file. Try again.",
      },
    };
  }

  return { error: null };
}

/**
 * Deletes multiple files from storage in a single request.
 */
export async function deleteFiles(
  bucket: StorageBucket,
  storagePaths: string[],
): Promise<{ error: StorageError | null }> {
  if (storagePaths.length === 0) return { error: null };

  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove(storagePaths);

  if (error) {
    return {
      error: {
        message: error.message,
        userMessage: "Some files couldn't be removed. Try again.",
      },
    };
  }

  return { error: null };
}
