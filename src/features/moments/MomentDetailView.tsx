'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Edit3,
  Plus,
  Trash2,
  Music,
  Play,
  Pause,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { momentsRepo } from '@/lib/supabase/db';
import { getSignedUrl } from '@/lib/storage/client';
import { useToast } from '@/components/ui/toast';
import { useMusic } from '@/engines/music';
import { getLayoutConfig } from '@/engines/moments/layouts';
import type { MomentLayoutType, Track } from '@/types';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressiveImage } from '@/components/media/progressive-image';
import { ResponsiveVideoPlayer } from '@/components/media/responsive-video-player';
import { formatMomentDate, type MomentWithMedia } from './utils';
import { MediaLightbox, type LightboxMediaItem } from './MediaLightbox';
import { MomentEditorModal, type MomentEditorFormData } from './MomentEditorModal';
import { AddMediaModal } from './AddMediaModal';
import { formatTrackTitle } from '@/features/soundtrack/utils';

export interface MomentDetailViewProps {
  momentId: string;
}

interface ResolvedMedia {
  id: string;
  joinId: string;
  type: 'photo' | 'video';
  sortOrder: number;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}

export function MomentDetailView({ momentId }: MomentDetailViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { engine, state: musicState } = useMusic();

  const [moment, setMoment] = useState<MomentWithMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<ResolvedMedia[]>([]);

  // Modals & Lightbox state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadMoment = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await momentsRepo.getById(momentId);
      if (!data) {
        showToast('Moment not found', 'error');
        router.push('/moments');
        return;
      }
      const typed = data as unknown as MomentWithMedia;
      setMoment(typed);

      // Resolve signed URLs for photos and videos
      const items: ResolvedMedia[] = [];

      // Photos
      if (typed.moment_photos) {
        for (const mp of typed.moment_photos) {
          if (mp.photo) {
            let url = mp.photo.storage_path;
            if (!url.startsWith('http') && !url.startsWith('blob:')) {
              const res = await getSignedUrl('photos', url);
              if (res.url) url = res.url;
            }
            items.push({
              id: mp.photo.id,
              joinId: mp.id,
              type: 'photo',
              sortOrder: mp.sort_order,
              url,
              caption: (mp as unknown as { caption?: { text?: string } })?.caption?.text || null,
            });
          }
        }
      }

      // Videos
      if (typed.moment_videos) {
        for (const mv of typed.moment_videos) {
          if (mv.video) {
            let url = mv.video.storage_path;
            let thumbUrl: string | null = null;
            if (!url.startsWith('http') && !url.startsWith('blob:')) {
              const res = await getSignedUrl('videos', url);
              if (res.url) url = res.url;
            }
            if (mv.video.thumbnail_path) {
              const thumbRes = await getSignedUrl('thumbnails', mv.video.thumbnail_path);
              if (thumbRes.url) thumbUrl = thumbRes.url;
            }
            items.push({
              id: mv.video.id,
              joinId: mv.id,
              type: 'video',
              sortOrder: mv.sort_order,
              url,
              thumbnailUrl: thumbUrl,
              caption: (mv as unknown as { caption?: { text?: string } })?.caption?.text || null,
            });
          }
        }
      }

      // Sort combined media items by sortOrder
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      setMediaItems(items);
    } catch {
      showToast("Couldn't load this moment.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [momentId, router, showToast]);

  useEffect(() => {
    void (async () => {
      await loadMoment();
    })();
  }, [loadMoment]);

  // Handle Save Editor
  const handleSaveEditor = async (formData: MomentEditorFormData) => {
    try {
      await momentsRepo.update(momentId, {
        title: formData.title,
        date: formData.date,
        is_draft: formData.is_draft,
        keep_offline: formData.keep_offline,
        presentation_settings: { layout: formData.layout },
      });
      showToast('Moment updated.', 'success');
      await loadMoment();
    } catch {
      showToast("Couldn't save changes.", 'error');
    }
  };

  // Handle Delete / Archive Moment
  const handleArchiveMoment = async () => {
    if (!moment) return;
    if (!window.confirm(`Are you sure you want to archive "${moment.title}"?`)) return;

    try {
      await momentsRepo.softDelete(moment.id, moment.world_id);
      showToast('Moment moved to archive.', 'success');
      router.push('/moments');
    } catch {
      showToast("Couldn't archive moment.", 'error');
    }
  };

  // Handle Remove Media Item
  const handleRemoveMedia = async (item: ResolvedMedia) => {
    try {
      if (item.type === 'photo') {
        await momentsRepo.removePhoto(item.joinId);
      } else {
        await momentsRepo.removeVideo(item.joinId);
      }
      setMediaItems((prev) => prev.filter((m) => m.joinId !== item.joinId));
      showToast('Media removed from moment.', 'success');
    } catch {
      showToast("Couldn't remove media item.", 'error');
    }
  };

  // Play moment soundtrack
  const handlePlayMomentSoundtrack = async (track: Track) => {
    try {
      engine.requestContext('moment');
      let audioUrl = track.storage_path;
      if (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:')) {
        const signed = await getSignedUrl('audio', track.storage_path);
        if (signed.url) audioUrl = signed.url;
      }
      await engine.load(track, audioUrl, true);
    } catch {
      showToast("Couldn't play soundtrack track.", 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xs text-muted-text">Opening moment memory...</p>
      </div>
    );
  }

  if (!moment) return null;

  const layoutType = (moment.presentation_settings?.layout as MomentLayoutType) || 'single-hero';
  const layoutConfig = getLayoutConfig(layoutType);
  const attachedTrack = moment.moment_tracks?.[0]?.track;

  const lightboxItems: LightboxMediaItem[] = mediaItems.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl,
    caption: m.caption,
  }));

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto pb-32">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/moments"
          className="inline-flex items-center gap-2 text-xs font-medium text-secondary-text hover:text-primary-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Moments</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setIsAddMediaOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Media
          </Button>

          <Button size="sm" variant="secondary" onClick={() => setIsEditorOpen(true)}>
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>

          <IconButton
            aria-label="Archive moment"
            size="sm"
            variant="ghost"
            onClick={handleArchiveMoment}
            className="text-muted-text hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* Moment Header Banner */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-text">
          <span className="flex items-center gap-1 font-medium text-accent">
            <Calendar className="w-3.5 h-3.5" />
            {formatMomentDate(moment.date)}
          </span>

          {moment.location?.name && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {moment.location.name}
              </span>
            </>
          )}

          {moment.is_draft && (
            <>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase">
                Draft
              </span>
            </>
          )}

          <span className="ml-auto text-[11px] text-muted-text/80 hidden sm:inline">
            Layout: {layoutConfig.label}
          </span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold text-primary-text tracking-tight">
          {moment.title}
        </h1>
      </div>

      {/* Attached Soundtrack Bar (if present) */}
      {attachedTrack && (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-semibold text-accent tracking-wider">
                Moment Soundtrack
              </span>
              <span className="text-xs sm:text-sm font-medium text-primary-text truncate">
                {formatTrackTitle(attachedTrack.track_number, attachedTrack.title)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (
                musicState.currentTrack?.id === attachedTrack.id &&
                musicState.playbackState === 'playing'
              ) {
                engine.pause();
              } else {
                handlePlayMomentSoundtrack(attachedTrack);
              }
            }}
          >
            {musicState.currentTrack?.id === attachedTrack.id &&
            musicState.playbackState === 'playing' ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Play Atmosphere
              </>
            )}
          </Button>
        </div>
      )}

      {/* Media Presentation Grid according to Layout Engine */}
      {mediaItems.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="No memories added to this moment yet"
          description="Add photographs or video recordings to bring this moment to life."
          action={
            <Button size="sm" onClick={() => setIsAddMediaOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Photos or Videos
            </Button>
          }
        />
      ) : (
        <div className={layoutConfig.containerClassName}>
          {mediaItems.map((item, index) => {
            const itemClass = layoutConfig.getItemClassName(index, mediaItems.length);

            return (
              <div key={item.joinId} className={`group relative ${itemClass} bg-surface`}>
                {item.type === 'photo' ? (
                  <div
                    className="w-full h-full cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <ProgressiveImage
                      src={item.url}
                      alt={item.caption || moment.title}
                      aspectRatio="w-full h-full"
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <ResponsiveVideoPlayer
                      src={item.url}
                      poster={item.thumbnailUrl || undefined}
                      aspectRatio="w-full h-full"
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    aria-label="View fullscreen"
                    onClick={() => setLightboxIndex(index)}
                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/90 backdrop-blur-sm transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Remove media"
                    onClick={() => handleRemoveMedia(item)}
                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-red-600/90 backdrop-blur-sm transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Caption overlay */}
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-xs">
                    {item.caption}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <MediaLightbox
        isOpen={lightboxIndex !== null}
        currentIndex={lightboxIndex || 0}
        items={lightboxItems}
        onIndexChange={(idx) => setLightboxIndex(idx)}
        onClose={() => setLightboxIndex(null)}
      />

      {/* Editor Modal */}
      <MomentEditorModal
        isOpen={isEditorOpen}
        moment={moment}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEditor}
      />

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={isAddMediaOpen}
        onClose={() => setIsAddMediaOpen(false)}
        worldId={moment.world_id}
        momentId={moment.id}
        existingPhotoCount={moment.moment_photos?.length || 0}
        existingVideoCount={moment.moment_videos?.length || 0}
        existingTrackCount={moment.moment_tracks?.length || 0}
        onPhotoAdded={async (photoId, sortOrder) => {
          await momentsRepo.addPhoto(moment.id, photoId, sortOrder);
          await loadMoment();
        }}
        onVideoAdded={async (videoId, sortOrder) => {
          await momentsRepo.addVideo(moment.id, videoId, sortOrder);
          await loadMoment();
        }}
        onTrackAdded={async (trackId, sortOrder) => {
          await momentsRepo.addTrack(moment.id, trackId, sortOrder);
          await loadMoment();
        }}
      />
    </div>
  );
}
