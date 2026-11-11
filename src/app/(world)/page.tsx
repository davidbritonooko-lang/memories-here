'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Film, Music, Archive, Sparkles, Play, Pause, ArrowRight, Heart } from 'lucide-react';
import { useWorldIdentity } from '@/features/identity';
import { useMusic } from '@/engines/music';
import { momentsRepo, soundtrackRepo, peshtokRepo } from '@/lib/supabase/db';
import { getSignedUrl } from '@/lib/storage/client';
import { getAmbientGreeting } from '@/features/home';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Track } from '@/types';
import type { MomentWithMedia } from '@/features/moments/utils';
import { getHeroThumbnail, formatMomentDate } from '@/features/moments/utils';
import { formatTrackTitle } from '@/features/soundtrack/utils';

export default function HomePage() {
  const { identity } = useWorldIdentity();
  const { engine, state: musicState } = useMusic();

  const greeting = getAmbientGreeting(identity?.displayName);
  const [latestMoment, setLatestMoment] = useState<MomentWithMedia | null>(null);
  const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
  const [latestHeroUrl, setLatestHeroUrl] = useState<string | null>(null);
  const [counts, setCounts] = useState({ moments: 0, tracks: 0, peshtok: 0 });

  const worldId =
    identity?.worldId ||
    (identity?.displayName ? `world-${identity.displayName.toLowerCase()}` : 'default-world');

  useEffect(() => {
    void (async () => {
      try {
        const [momentsData, tracksData, feedData] = await Promise.all([
          momentsRepo.listByWorld(worldId).catch(() => []),
          soundtrackRepo.listTracks(worldId).catch(() => []),
          peshtokRepo.listFeed(worldId).catch(() => []),
        ]);

        const momentsList = (momentsData || []) as unknown as MomentWithMedia[];
        const tracksList = (tracksData || []) as unknown as Track[];
        const feedList = (feedData || []) as unknown as unknown[];

        setCounts({
          moments: momentsList.length,
          tracks: tracksList.length,
          peshtok: feedList.length,
        });

        if (momentsList.length > 0) {
          const first = momentsList[0];
          setLatestMoment(first);
          const heroPath = getHeroThumbnail(first);
          if (heroPath && !heroPath.startsWith('http') && !heroPath.startsWith('blob:')) {
            const bucket = heroPath.includes('/videos/') ? 'thumbnails' : 'photos';
            const res = await getSignedUrl(bucket, heroPath);
            if (res.url) setLatestHeroUrl(res.url);
          }
        }

        if (tracksList.length > 0) {
          setFeaturedTrack(tracksList[0]);
        }
      } catch {
        // Fallback gracefully
      }
    })();
  }, [worldId]);

  const handlePlayFeaturedTrack = async () => {
    if (!featuredTrack) return;
    try {
      engine.requestContext('home');
      let audioUrl = featuredTrack.storage_path;
      if (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:')) {
        const res = await getSignedUrl('audio', featuredTrack.storage_path);
        if (res.url) audioUrl = res.url;
      }
      await engine.load(featuredTrack, audioUrl, true);
    } catch {
      // Audio playback fallback
    }
  };

  return (
    <div className="flex flex-col gap-10 p-4 md:p-8 max-w-5xl mx-auto pb-32">
      {/* Ambient Hero Greeting */}
      <div className="flex flex-col gap-3 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Her Private Sanctuary</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-semibold text-primary-text tracking-tight leading-tight">
          {greeting.title}
        </h1>

        <p className="text-base sm:text-lg text-secondary-text max-w-xl font-light">
          {greeting.subtitle}
        </p>
      </div>

      {/* Featured Atmosphere Soundtrack Bar (if tracks exist) */}
      {featuredTrack && (
        <Card variant="elevated" className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-accent/15 text-accent shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-semibold text-accent tracking-wider">
                Ambient Soundtrack
              </span>
              <span className="text-sm sm:text-base font-medium text-primary-text truncate">
                {formatTrackTitle(featuredTrack.track_number, featuredTrack.title)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (
                musicState.currentTrack?.id === featuredTrack.id &&
                musicState.playbackState === 'playing'
              ) {
                engine.pause();
              } else {
                handlePlayFeaturedTrack();
              }
            }}
          >
            {musicState.currentTrack?.id === featuredTrack.id &&
            musicState.playbackState === 'playing' ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5" /> Play Atmosphere
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Spotlight: Latest Moment (if any) */}
      {latestMoment && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
              Recent Highlight
            </span>
            <Link
              href="/moments"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <Link href={`/moments/${latestMoment.id}`} className="group block">
            <Card
              interactive
              variant="default"
              className="grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            >
              <div className="md:col-span-7 aspect-[16/10] bg-elevated overflow-hidden">
                {latestHeroUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={latestHeroUrl}
                    alt={latestMoment.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-text">
                    <Camera className="w-12 h-12 opacity-30" />
                  </div>
                )}
              </div>

              <div className="md:col-span-5 p-6 flex flex-col justify-center">
                <span className="text-xs font-mono text-accent">
                  {formatMomentDate(latestMoment.date)}
                </span>
                <h3 className="font-editorial text-2xl font-semibold text-primary-text mt-1 group-hover:text-accent transition-colors">
                  {latestMoment.title}
                </h3>
                {latestMoment.location?.name && (
                  <p className="text-xs text-secondary-text mt-2">
                    📍 {latestMoment.location.name}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-accent">
                  <span>Open memory</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Primary Portals Navigation Grid */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
          Explore Her World
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Moments */}
          <Link href="/moments">
            <Card interactive variant="default" className="p-5 h-full flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-muted-text">
                  {counts.moments} saved
                </span>
              </div>
              <div className="mt-6">
                <h3 className="font-editorial text-lg font-semibold text-primary-text">Moments</h3>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  Composed memories, each one worth keeping.
                </p>
              </div>
            </Card>
          </Link>

          {/* PeshTok */}
          <Link href="/peshtok">
            <Card interactive variant="default" className="p-5 h-full flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <Film className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-muted-text">
                  {counts.peshtok} clips
                </span>
              </div>
              <div className="mt-6">
                <h3 className="font-editorial text-lg font-semibold text-primary-text">PeshTok</h3>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  Her world in motion, alive and playful.
                </p>
              </div>
            </Card>
          </Link>

          {/* Soundtrack */}
          <Link href="/soundtrack">
            <Card interactive variant="default" className="p-5 h-full flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <Music className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-muted-text">
                  {counts.tracks} tracks
                </span>
              </div>
              <div className="mt-6">
                <h3 className="font-editorial text-lg font-semibold text-primary-text">Soundtrack</h3>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  Atmospheric music that lives inside her world.
                </p>
              </div>
            </Card>
          </Link>

          {/* Archive */}
          <Link href="/archive">
            <Card interactive variant="default" className="p-5 h-full flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <Archive className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-muted-text">Vault</span>
              </div>
              <div className="mt-6">
                <h3 className="font-editorial text-lg font-semibold text-primary-text">Archive</h3>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  Quiet. Museum-like. Every memory preserved.
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Heartfelt Footer Note */}
      <div className="flex flex-col items-center justify-center text-center pt-8 border-t border-border/60">
        <Heart className="w-5 h-5 text-accent/60 mb-2 fill-accent/20 animate-pulse" />
        <p className="font-editorial text-sm text-secondary-text italic">
          &ldquo;A little corner of the internet created with love for the one who makes the world brighter.&rdquo;
        </p>
      </div>
    </div>
  );
}
