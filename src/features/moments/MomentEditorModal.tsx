'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MOMENT_LAYOUTS } from '@/engines/moments/layouts';
import type { MomentLayoutType } from '@/types';
import type { MomentWithMedia } from './utils';

export interface MomentEditorFormData {
  title: string;
  date: string;
  layout: MomentLayoutType;
  is_draft: boolean;
  keep_offline: boolean;
}

export interface MomentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: MomentWithMedia;
  onSave: (data: MomentEditorFormData) => Promise<void>;
}

export function MomentEditorModal({
  isOpen,
  onClose,
  moment,
  onSave,
}: MomentEditorModalProps) {
  const initialLayout = (moment.presentation_settings?.layout as MomentLayoutType) || 'single-hero';
  const [title, setTitle] = useState(moment.title);
  const [date, setDate] = useState(moment.date);
  const [layout, setLayout] = useState<MomentLayoutType>(initialLayout);
  const [isDraft, setIsDraft] = useState(moment.is_draft);
  const [keepOffline, setKeepOffline] = useState(Boolean(moment.keep_offline));
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      await onSave({
        title: title.trim(),
        date,
        layout,
        is_draft: isDraft,
        keep_offline: keepOffline,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Moment"
      description="Refine presentation layout, title, and offline availability."
    >
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Layout Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Presentation Layout
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(MOMENT_LAYOUTS) as MomentLayoutType[]).map((key) => {
              const config = MOMENT_LAYOUTS[key];
              const isSelected = layout === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayout(key)}
                  className={`flex flex-col p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-sm'
                      : 'border-border bg-surface hover:border-accent/30'
                  }`}
                >
                  <span className="text-xs font-medium text-primary-text">{config.label}</span>
                  <span className="mt-1 text-[10px] text-secondary-text line-clamp-2">
                    {config.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Draft & Offline Toggles */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
            />
            <span className="text-sm text-secondary-text">Draft (hide from public view)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepOffline}
              onChange={(e) => setKeepOffline(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
            />
            <span className="text-sm text-secondary-text">Keep available offline</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !title.trim()}>
            {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
