'use client';

import React, { useState } from 'react';
import { MediaPlaceholder } from '@/components/ui/media-placeholder';
import { Skeleton } from '@/components/ui/skeleton';

export interface ResponsiveVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  aspectRatio?: string;
  className?: string;
}

export function ResponsiveVideoPlayer({
  src,
  poster,
  aspectRatio = 'aspect-[9/16]',
  className = '',
  controls = true,
  playsInline = true,
  ...props
}: ResponsiveVideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl ${aspectRatio} ${className}`}>
        <MediaPlaceholder type="video" label="Video unavailable" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ${aspectRatio} ${className}`}>
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}

      <video
        src={src}
        poster={poster}
        controls={controls}
        playsInline={playsInline}
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
