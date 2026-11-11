'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Camera, Plus, Filter, Sparkles } from 'lucide-react';
import { useWorldIdentity } from '@/features/identity';
import { momentsRepo } from '@/lib/supabase/db';
import { getSignedUrl } from '@/lib/storage/client';
import { MomentCard } from '@/features/moments/MomentCard';
import { CreateMomentModal } from '@/features/moments/CreateMomentModal';
import type { CreateMomentFormData } from '@/features/moments/CreateMomentModal';
import type { MomentWithMedia } from '@/features/moments/utils';
import { sortMomentsByDate, getHeroThumbnail } from '@/features/moments/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

type ViewFilter = 'all' | 'published' | 'drafts';

export default function MomentsPage() {
  const { identity } = useWorldIdentity();
  const { showToast } = useToast();

  const [moments, setMoments] = useState<MomentWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  const worldId = identity?.worldId;

  // Load moments from database
  const loadMoments = useCallback(async () => {
    if (!worldId) return;
    setIsLoading(true);
    try {
      const data = await momentsRepo.listByWorld(worldId);
      const typed = sortMomentsByDate((data || []) as unknown as MomentWithMedia[]);
      setMoments(typed);

      // Resolve hero thumbnail URLs in parallel
      const urlMap: Record<string, string> = {};
      await Promise.allSettled(
        typed.map(async (m) => {
          const heroPath = getHeroThumbnail(m);
          if (heroPath && !heroPath.startsWith('http') && !heroPath.startsWith('blob:')) {
            try {
              const bucket = heroPath.includes('/videos/') ? 'thumbnails' : 'photos';
              const res = await getSignedUrl(bucket, heroPath);
              if (res.url) urlMap[m.id] = res.url;
            } catch {
              // Thumbnail resolution is optional
            }
          }
        })
      );
      setThumbnailUrls(urlMap);
    } catch {
      showToast("Couldn't load your moments.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [worldId, showToast]);

  useEffect(() => {
    void (async () => {
      await loadMoments();
    })();
  }, [loadMoments]);

  // Filtered moments
  const filteredMoments = useMemo(() => {
    if (filter === 'published') return moments.filter((m) => !m.is_draft);
    if (filter === 'drafts') return moments.filter((m) => m.is_draft);
    return moments;
  }, [moments, filter]);

  const draftCount = moments.filter((m) => m.is_draft).length;

  // Create new moment
  const handleCreateMoment = async (formData: CreateMomentFormData) => {
    if (!worldId) {
      showToast("Couldn't identify your private world.", 'error');
      return;
    }

    try {
      const created = await momentsRepo.create({
        world_id: worldId,
        title: formData.title,
        date: formData.date,
        is_draft: formData.is_draft,
      });

      setMoments((prev) =>
        sortMomentsByDate([created as unknown as MomentWithMedia, ...prev])
      );
      setShowCreateModal(false);
      showToast('New moment created.', 'success');
    } catch {
      showToast("Couldn't create moment.", 'error');
    }
  };

  // Archive moment
  const handleArchiveMoment = async (moment: MomentWithMedia) => {
    if (!worldId) {
      showToast("Couldn't identify your private world.", 'error');
      return;
    }

    try {
      await momentsRepo.softDelete(moment.id);
      setMoments((prev) => prev.filter((m) => m.id !== moment.id));
      showToast(`"${moment.title}" moved to archive.`, 'success');
    } catch {
      showToast("Couldn't archive this moment.", 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="font-editorial text-3xl font-semibold text-primary-text tracking-tight">
              Moments
            </h1>
          </div>
          <p className="mt-1 text-sm text-secondary-text">
            Composed memories, each one worth keeping.
          </p>
        </div>

        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Moment
        </Button>
      </div>

      {/* Filter Tabs */}
      {moments.length > 0 && (
        <Tabs
          activeTab={filter}
          onChange={(v) => setFilter(v as ViewFilter)}
          tabs={[
            { id: 'all', label: `All (${moments.length})` },
            { id: 'published', label: `Published (${moments.length - draftCount})` },
            { id: 'drafts', label: `Drafts (${draftCount})` },
          ]}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-muted-text">Loading your moments...</p>
        </div>
      ) : filteredMoments.length === 0 ? (
        moments.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="No moments yet"
            description="Create your first moment to start composing beautiful memories with photos, videos, and soundtrack."
            action={
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                Create First Moment
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Filter className="w-6 h-6" />}
            title={filter === 'drafts' ? 'No drafts' : 'No published moments'}
            description={
              filter === 'drafts'
                ? 'All your moments are published.'
                : 'Publish some drafts to see them here.'
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMoments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              thumbnailUrl={thumbnailUrls[moment.id]}
              onArchive={handleArchiveMoment}
            />
          ))}
        </div>
      )}

      {/* Create Moment Modal */}
      <CreateMomentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMoment}
      />
    </div>
  );
}
