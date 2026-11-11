/**
 * Media Processing & Upload Orchestrator
 * High-level service coordinating client-side validation, metadata extraction,
 * storage upload, and database record creation.
 * Specification Sections: 16, 17, 20, 48
 */

import { deleteFile, uploadFile } from '@/lib/storage/client';
import { validateFile } from '@/lib/storage/validation';
import { photosRepo, videosRepo, soundtrackRepo } from '@/lib/supabase/db';
import { extractImageDimensions, extractVideoMetadata, generateVideoThumbnailBlob } from './metadata';
import type { Photo, Video, Track } from '@/types';

export interface ProcessMediaResult<T> {
  data: T | null;
  error: string | null;
}

async function cleanupUploadedFile(
  bucket: 'photos' | 'videos' | 'audio' | 'thumbnails',
  path: string
): Promise<string | null> {
  try {
    const result = await deleteFile(bucket, path);
    return result.error?.message ?? null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown cleanup error.';
  }
}

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function validateMediaFile(
  bucket: 'photos' | 'videos' | 'audio',
  file: File
): string | null {
  const validation = validateFile(bucket, file);
  return validation.valid ? null : validation.error || 'This file is not supported.';
}

/**
 * Validates, uploads, and registers a photo asset.
 */
export async function uploadAndRegisterPhoto(
  worldId: string,
  file: File
): Promise<ProcessMediaResult<Photo>> {
  const validationError = validateMediaFile('photos', file);
  if (validationError) return { data: null, error: validationError };

  let uploadedPath: string | null = null;
  try {
    // 1. Extract dimensions (non-blocking fallback on failure)
    let width: number | undefined;
    let height: number | undefined;
    try {
      const dimensions = await extractImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      // Graceful fallback: dimensions stay undefined
    }

    // 2. Upload file to storage
    const uploadRes = await uploadFile('photos', worldId, file);
    if (uploadRes.error || !uploadRes.data) {
      return { data: null, error: uploadRes.error?.userMessage || "Failed to upload photo." };
    }
    uploadedPath = uploadRes.data.path;

    // 3. Register record in PostgreSQL
    const photoRecord = await photosRepo.create({
      world_id: worldId,
      storage_path: uploadRes.data.path,
      thumbnail_path: null,
      width: width || null,
      height: height || null,
      mime_type: file.type || 'image/jpeg',
      file_size: file.size,
    });

    return {
      data: photoRecord as unknown as Photo,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = failureMessage(err, 'Failed to register photo.');
    const cleanupError = uploadedPath
      ? await cleanupUploadedFile('photos', uploadedPath)
      : null;
    return {
      data: null,
      error: cleanupError
        ? `${errorMsg} The uploaded file could not be removed: ${cleanupError}`
        : errorMsg,
    };
  }
}

/**
 * Validates, uploads, extracts metadata, optionally thumbnails, and registers a video asset.
 */
export async function uploadAndRegisterVideo(
  worldId: string,
  file: File
): Promise<ProcessMediaResult<Video>> {
  const validationError = validateMediaFile('videos', file);
  if (validationError) return { data: null, error: validationError };

  let uploadedPath: string | null = null;
  let thumbnailPath: string | null = null;
  try {
    // 1. Extract video metadata
    let durationSeconds = 0;
    let width: number | undefined;
    let height: number | undefined;
    let hasAudio = true;

    try {
      const meta = await extractVideoMetadata(file);
      durationSeconds = meta.durationSeconds;
      width = meta.width;
      height = meta.height;
      hasAudio = meta.hasAudio;
    } catch {
      // Continue with safe defaults
    }

    // 2. Upload video file to 'videos' bucket
    const uploadRes = await uploadFile('videos', worldId, file);
    if (uploadRes.error || !uploadRes.data) {
      return { data: null, error: uploadRes.error?.userMessage || "Failed to upload video." };
    }
    uploadedPath = uploadRes.data.path;

    // 3. Optional thumbnail generation and upload
    try {
      const thumbBlob = await generateVideoThumbnailBlob(file);
      if (thumbBlob) {
        const thumbFile = new File([thumbBlob], `${file.name.replace(/\.[^/.]+$/, '')}_thumb.webp`, {
          type: 'image/webp',
        });
        const thumbUploadRes = await uploadFile('thumbnails', worldId, thumbFile);
        if (thumbUploadRes.data) {
          thumbnailPath = thumbUploadRes.data.path;
        }
      }
    } catch {
      // Thumbnails are progressive enhancement
    }

    // 4. Register video record in database
    const videoRecord = await videosRepo.create({
      world_id: worldId,
      storage_path: uploadRes.data.path,
      thumbnail_path: thumbnailPath,
      duration_seconds: durationSeconds,
      width: width || null,
      height: height || null,
      mime_type: file.type || 'video/mp4',
      file_size: file.size,
      has_audio: hasAudio,
    });

    return {
      data: videoRecord as unknown as Video,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = failureMessage(err, 'Failed to register video.');
    const cleanupErrors = (
      await Promise.all([
        uploadedPath ? cleanupUploadedFile('videos', uploadedPath) : null,
        thumbnailPath ? cleanupUploadedFile('thumbnails', thumbnailPath) : null,
      ])
    ).filter((message): message is string => message !== null);
    return {
      data: null,
      error: cleanupErrors.length
        ? `${errorMsg} Uploaded files could not be removed: ${cleanupErrors.join('; ')}`
        : errorMsg,
    };
  }
}

/**
 * Validates, uploads, auto-numbers, and registers a soundtrack track.
 */
export async function uploadAndRegisterTrack(
  worldId: string,
  file: File,
  title?: string
): Promise<ProcessMediaResult<Track>> {
  const validationError = validateMediaFile('audio', file);
  if (validationError) return { data: null, error: validationError };

  let uploadedPath: string | null = null;
  try {
    const uploadRes = await uploadFile('audio', worldId, file);
    if (uploadRes.error || !uploadRes.data) {
      return { data: null, error: uploadRes.error?.userMessage || "Failed to upload soundtrack track." };
    }
    uploadedPath = uploadRes.data.path;

    const trackRecord = await soundtrackRepo.createNextTrack({
      title: title?.trim() || null,
      storage_path: uploadRes.data.path,
      mime_type: file.type || 'audio/mpeg',
      file_size: file.size,
    });

    return {
      data: trackRecord as unknown as Track,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = failureMessage(err, 'Failed to register soundtrack track.');
    const cleanupError = uploadedPath
      ? await cleanupUploadedFile('audio', uploadedPath)
      : null;
    return {
      data: null,
      error: cleanupError
        ? `${errorMsg} The uploaded file could not be removed: ${cleanupError}`
        : errorMsg,
    };
  }
}
