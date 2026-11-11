'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Film, MapPin, Archive, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MomentWithMedia } from './utils';
import { formatMomentDate, mediaSummary, getHeroThumbnail } from './utils';

export interface MomentCardProps {
  moment: MomentWithMedia;
  thumbnailUrl?: string | null;
  onArchive?: (moment: MomentWithMedia) => void;
}

export function MomentCard({ moment, thumbnailUrl, onArchive }: MomentCardProps) {
  const heroPath = getHeroThumbnail(moment);
  const resolvedUrl = thumbnailUrl ?? null;
  const photoCount = moment.moment_photos?.length ?? 0;
  const videoCount = moment.moment_videos?.length ?? 0;
  const summary = mediaSummary(moment);

  return (
    <Card interactive variant="default" className="group relative">
      <Link
        href={`/moments/${moment.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
      >
        {/* Hero Thumbnail */}
        <div className="relative aspect-[4/3] bg-elevated overflow-hidden rounded-t-2xl">
          {resolvedUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={resolvedUrl}
              alt={moment.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : heroPath ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-text">
              <Camera className="w-8 h-8 opacity-30" />
            </div>
          )}

          {/* Draft badge */}
          {moment.is_draft && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-full bg-amber-500/90 text-white">
              Draft
            </span>
          )}

          {/* Media count overlay */}
          {(photoCount > 0 || videoCount > 0) && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              {photoCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                  <Camera className="w-3 h-3" />
                  {photoCount}
                </span>
              )}
              {videoCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                  <Film className="w-3 h-3" />
                  {videoCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3 className="font-editorial text-base font-semibold text-primary-text truncate">
            {moment.title}
          </h3>

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-text">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatMomentDate(moment.date, 'short')}
            </span>

            {moment.location?.name && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{moment.location.name}</span>
                </span>
              </>
            )}
          </div>

          <p className="mt-1.5 text-[11px] text-secondary-text">
            {summary}
          </p>
        </div>
      </Link>

      {/* Archive button (hover reveal) */}
      {onArchive && (
        <button
          type="button"
          aria-label={`Archive ${moment.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onArchive(moment);
          }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-xl bg-black/40 text-white hover:bg-red-500/80 backdrop-blur-sm transition-all"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}
    </Card>
  );
}
