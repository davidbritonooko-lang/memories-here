'use client';

import React, { useState } from 'react';
import { MediaPlaceholder } from '@/components/ui/media-placeholder';
import { Skeleton } from '@/components/ui/skeleton';

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  thumbnailSrc?: string | null;
  alt: string;
  aspectRatio?: string;
  className?: string;
}

export function ProgressiveImage({
  src,
  thumbnailSrc,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`w-full overflow-hidden rounded-xl ${aspectRatio} ${className}`}>
        <MediaPlaceholder type="photo" label="Image unavailable" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-surface ${aspectRatio} ${className}`}>
      {/* Skeleton placeholder before anything loads */}
      {!isLoaded && !thumbnailSrc && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Blurred thumbnail if available */}
      {thumbnailSrc && !isLoaded && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={thumbnailSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-md scale-105 transition-opacity duration-300"
        />
      )}

      {/* High-resolution image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
