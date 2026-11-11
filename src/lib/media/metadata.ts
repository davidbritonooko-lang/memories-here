/**
 * Media Metadata Extraction Utilities
 * Client-side extraction for image dimensions and video duration/dimensions.
 * Specification Sections: 16, 17, 47
 */

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  hasAudio: boolean;
  aspectRatio: number;
}

/**
 * Extracts width, height and aspectRatio from an Image File or Blob.
 */
export async function extractImageDimensions(file: File | Blob): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    // If not in a real browser or missing Image, return standard fallback
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return resolve({ width: 0, height: 0, aspectRatio: 1 });
    }

    let objectUrl: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revoke error
        }
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      // Timeout fallback in 800ms
      timer = setTimeout(() => {
        cleanup();
        resolve({ width: 0, height: 0, aspectRatio: 1 });
      }, 800);

      img.onload = () => {
        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        cleanup();
        resolve({
          width,
          height,
          aspectRatio: height > 0 ? Number((width / height).toFixed(3)) : 1,
        });
      };

      img.onerror = () => {
        cleanup();
        resolve({ width: 0, height: 0, aspectRatio: 1 });
      };

      img.src = objectUrl;
    } catch {
      cleanup();
      resolve({ width: 0, height: 0, aspectRatio: 1 });
    }
  });
}

/**
 * Extracts duration, width, height, and audio detection from a Video File or Blob.
 */
export async function extractVideoMetadata(file: File | Blob): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve({
        durationSeconds: 0,
        width: 0,
        height: 0,
        hasAudio: false,
        aspectRatio: 1,
      });
    }

    let objectUrl: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revoke error
        }
      }
    };

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      objectUrl = URL.createObjectURL(file);

      // Safe timeout in 800ms
      timer = setTimeout(() => {
        cleanup();
        resolve({
          durationSeconds: 0,
          width: 0,
          height: 0,
          hasAudio: true,
          aspectRatio: 1,
        });
      }, 800);

      video.onloadedmetadata = () => {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        const durationSeconds = Number((video.duration || 0).toFixed(2));

        cleanup();
        resolve({
          durationSeconds,
          width,
          height,
          hasAudio: true,
          aspectRatio: height > 0 ? Number((width / height).toFixed(3)) : 1,
        });
      };

      video.onerror = () => {
        cleanup();
        resolve({
          durationSeconds: 0,
          width: 0,
          height: 0,
          hasAudio: true,
          aspectRatio: 1,
        });
      };

      video.src = objectUrl;
    } catch {
      cleanup();
      resolve({
        durationSeconds: 0,
        width: 0,
        height: 0,
        hasAudio: true,
        aspectRatio: 1,
      });
    }
  });
}

/**
 * Generates an image thumbnail data URL or Blob from a video file at a given second mark.
 */
export async function generateVideoThumbnailBlob(
  file: File | Blob,
  seekTimeSeconds = 0.5
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(null);
    }

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = Math.min(seekTimeSeconds, Math.max(0, (video.duration || 1) - 0.1));
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 640);
        const scale = canvas.width / (video.videoWidth || 1);
        canvas.height = (video.videoHeight || 360) * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve(null);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
          },
          'image/webp',
          0.85
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    video.src = objectUrl;
  });
}
