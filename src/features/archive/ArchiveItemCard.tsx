'use client';

import React from 'react';
import { Camera, Film, Music, Sparkles, RotateCcw, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import type { ArchiveItem, EntityType } from '@/types';
import { formatMomentDate } from '@/features/moments/utils';

export interface EnrichedArchiveItem extends ArchiveItem {
  displayName?: string;
  previewUrl?: string | null;
}

export interface ArchiveItemCardProps {
  item: EnrichedArchiveItem;
  onRestore: (item: EnrichedArchiveItem) => void;
  onPermanentDelete: (item: EnrichedArchiveItem) => void;
  isProcessing?: boolean;
}

export function ArchiveItemCard({
  item,
  onRestore,
  onPermanentDelete,
  isProcessing = false,
}: ArchiveItemCardProps) {
  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'moment':
        return <Sparkles className="w-4 h-4 text-accent" />;
      case 'track':
        return <Music className="w-4 h-4 text-accent" />;
      case 'photo':
        return <Camera className="w-4 h-4 text-accent" />;
      case 'video':
        return <Film className="w-4 h-4 text-accent" />;
    }
  };

  const entityTypeLabel: Record<EntityType, string> = {
    moment: 'Moment',
    track: 'Soundtrack Track',
    photo: 'Photograph',
    video: 'Video Clip',
  };

  return (
    <Card variant="default" className="flex items-center justify-between p-4 group">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-3 rounded-2xl bg-surface border border-border shrink-0">
          {getEntityIcon(item.entity_type)}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-accent tracking-wider">
              {entityTypeLabel[item.entity_type]}
            </span>
            <span className="text-border">·</span>
            <span className="text-[11px] text-muted-text">
              Archived {formatMomentDate(item.archived_at, 'short')}
            </span>
          </div>
          <span className="text-sm font-medium text-primary-text truncate">
            {item.displayName || `${item.entity_type} #${item.entity_id.slice(0, 8)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRestore(item)}
          disabled={isProcessing}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Restore
        </Button>

        <IconButton
          aria-label="Delete permanently"
          size="sm"
          variant="ghost"
          onClick={() => onPermanentDelete(item)}
          disabled={isProcessing}
          className="text-muted-text hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </div>
    </Card>
  );
}
