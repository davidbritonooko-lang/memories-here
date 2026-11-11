'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { todayISO } from './utils';

export interface CreateMomentFormData {
  title: string;
  date: string;
  is_draft: boolean;
}

export interface CreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMomentFormData) => Promise<void>;
}

export function CreateMomentModal({ isOpen, onClose, onSubmit }: CreateMomentModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        date,
        is_draft: isDraft,
      });
      // Reset form
      setTitle('');
      setDate(todayISO());
      setIsDraft(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Moment"
      description="Capture a memory. You can add photos, videos, and soundtrack later."
    >
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. Sunday at the park, Her birthday surprise"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
          />
          <span className="text-sm text-secondary-text">
            Save as draft (not visible in feed yet)
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? <Spinner size="sm" /> : 'Create Moment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
