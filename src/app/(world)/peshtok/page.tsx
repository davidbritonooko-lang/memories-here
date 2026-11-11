'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useWorldIdentity } from '@/features/identity';
import { peshtokRepo } from '@/lib/supabase/db';
import { getSignedUrl } from '@/lib/storage/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PeshTokVideoCard, UploadPeshTokModal } from '@/features/peshtok';
import type { PeshTokVideo } from '@/types';

interface ResolvedFeedItem {
  item: PeshTokVideo;
  videoUrl: string;
  thumbnailUrl?: string | null;
}

export default function PeshTokPage() {
  const { identity } = useWorldIdentity();
  const { showToast } = useToast();

  const [feed, setFeed] = useState<ResolvedFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const worldId = identity?.worldId ?? '';
  const currentUserName = identity?.displayName ?? '';

  const loadFeed = useCallback(async () => {
    if (!worldId) {
      setFeed([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await peshtokRepo.listFeed(worldId);
      const rawVideos = (data || []) as unknown as PeshTokVideo[];

      // Resolve signed video and thumbnail URLs
      const resolved: ResolvedFeedItem[] = [];
      for (const v of rawVideos) {
        if (v.video) {
          let videoUrl = v.video.storage_path;
          let thumbUrl: string | null = null;

          if (!videoUrl.startsWith('http') && !videoUrl.startsWith('blob:')) {
            const res = await getSignedUrl('videos', videoUrl);
            if (res.url) videoUrl = res.url;
          }

          if (v.video.thumbnail_path) {
            const thumbRes = await getSignedUrl('thumbnails', v.video.thumbnail_path);
            if (thumbRes.url) thumbUrl = thumbRes.url;
          }

          resolved.push({
            item: v,
            videoUrl,
            thumbnailUrl: thumbUrl,
          });
        }
      }

      setFeed(resolved);
    } catch {
      showToast("Couldn't load your PeshTok feed.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [worldId, showToast]);

  useEffect(() => {
    void (async () => {
      await loadFeed();
    })();
  }, [loadFeed]);

  // Handle scroll snap to update active index
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const scrollPos = container.scrollTop;
    const itemHeight = container.clientHeight;
    const index = Math.round(scrollPos / itemHeight);
    if (index !== activeIndex && index >= 0 && index < feed.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto h-[calc(100vh-5rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-peshtok text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
            PeshTok
          </h1>
          <p className="text-xs text-secondary-text">Short-form videos from your private archive.</p>
        </div>

        <Button size="sm" onClick={() => setIsUploadOpen(true)} disabled={!worldId}>
          <Plus className="w-4 h-4 mr-1.5" />
          Post Clip
        </Button>
      </div>

      {/* Feed Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-muted-text">Loading video moments...</p>
        </div>
      ) : feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="No clips on PeshTok yet"
            description="Share short vertical videos from your archive."
            action={
              <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Upload First Video
              </Button>
            }
          />
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-none flex flex-col gap-6"
        >
          {feed.map((item, idx) => (
            <PeshTokVideoCard
              key={item.item.id}
              item={item.item}
              videoUrl={item.videoUrl}
              thumbnailUrl={item.thumbnailUrl}
              worldId={worldId}
              currentUserName={currentUserName}
              isActive={idx === activeIndex}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadPeshTokModal
        isOpen={isUploadOpen && Boolean(worldId)}
        onClose={() => setIsUploadOpen(false)}
        worldId={worldId}
        onPublished={() => {
          showToast('New clip published to PeshTok!', 'success');
          loadFeed();
        }}
      />
    </div>
  );
}
