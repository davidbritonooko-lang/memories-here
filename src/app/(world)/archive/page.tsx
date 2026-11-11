'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Archive, Sparkles, Filter } from 'lucide-react';
import { useWorldIdentity } from '@/features/identity';
import { archiveRepo } from '@/lib/supabase/db';
import { useToast } from '@/components/ui/toast';
import { Tabs } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ArchiveItemCard, type EnrichedArchiveItem } from '@/features/archive';
import type { EntityType } from '@/types';

type FilterType = 'all' | EntityType;

export default function ArchivePage() {
  const { identity } = useWorldIdentity();
  const { showToast } = useToast();

  const [items, setItems] = useState<EnrichedArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const worldId =
    identity?.worldId ||
    (identity?.displayName ? `world-${identity.displayName.toLowerCase()}` : 'default-world');

  const loadArchive = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await archiveRepo.listArchive(worldId);
      setItems((data || []) as unknown as EnrichedArchiveItem[]);
    } catch {
      showToast("Couldn't load archive entries.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [worldId, showToast]);

  useEffect(() => {
    void (async () => {
      await loadArchive();
    })();
  }, [loadArchive]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.entity_type === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      moment: items.filter((i) => i.entity_type === 'moment').length,
      track: items.filter((i) => i.entity_type === 'track').length,
      photo: items.filter((i) => i.entity_type === 'photo').length,
      video: items.filter((i) => i.entity_type === 'video').length,
    };
  }, [items]);

  // Handle Restore
  const handleRestore = async (item: EnrichedArchiveItem) => {
    setProcessingId(item.id);
    try {
      await archiveRepo.restoreItem(item.id, item.entity_type, item.entity_id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Restored ${item.entity_type} back to Her World.`, 'success');
    } catch {
      showToast(`Couldn't restore this ${item.entity_type}.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Permanent Delete
  const handlePermanentDelete = async (item: EnrichedArchiveItem) => {
    if (!window.confirm(`Permanently delete this ${item.entity_type}? This cannot be undone.`)) {
      return;
    }
    setProcessingId(item.id);
    try {
      await archiveRepo.permanentlyDelete(item.id, item.entity_type, item.entity_id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Permanently deleted ${item.entity_type}.`, 'info');
    } catch {
      showToast(`Couldn't delete this ${item.entity_type}.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-accent/10 text-accent">
            <Archive className="w-5 h-5" />
          </span>
          <h1 className="font-editorial text-3xl font-semibold text-primary-text tracking-tight">
            Archive
          </h1>
        </div>
        <p className="mt-1 text-sm text-secondary-text">
          Quiet. Museum-like. Every archived memory preserved and restorable.
        </p>
      </div>

      {/* Filter Tabs */}
      {items.length > 0 && (
        <Tabs
          activeTab={filter}
          onChange={(tab) => setFilter(tab as FilterType)}
          tabs={[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'moment', label: `Moments (${counts.moment})` },
            { id: 'track', label: `Soundtrack (${counts.track})` },
            { id: 'photo', label: `Photos (${counts.photo})` },
            { id: 'video', label: `Videos (${counts.video})` },
          ]}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-muted-text">Accessing archive vault...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="The archive is quiet"
            description="Nothing has been archived. Every moment, track, and memory is alive and present in her world."
          />
        ) : (
          <EmptyState
            icon={<Filter className="w-6 h-6" />}
            title={`No archived ${filter}s`}
            description="No items match the selected filter category."
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <ArchiveItemCard
              key={item.id}
              item={item}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              isProcessing={processingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
