'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { MediaUploadDropzone } from '@/components/media/media-upload-dropzone';
import { uploadAndRegisterVideo } from '@/lib/media/service';
import { peshtokRepo } from '@/lib/supabase/db';
import type { PeshTokProfileTheme } from '@/types';

export interface UploadPeshTokModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  onPublished: () => void;
}

const THEMES: PeshTokProfileTheme[] = ['Soft', 'Midnight', 'Playful', 'Afterglow', 'Monochrome'];

export function UploadPeshTokModal({
  isOpen,
  onClose,
  worldId,
  onPublished,
}: UploadPeshTokModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [theme, setTheme] = useState<PeshTokProfileTheme>('Soft');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setErrorMsg(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a video file first.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);

      // 1. Upload video to storage & register record in 'videos' table
      const res = await uploadAndRegisterVideo(worldId, selectedFile);
      if (!res.data) {
        throw new Error(res.error || 'Failed to upload video');
      }

      // 2. Publish to peshtok_videos feed
      await peshtokRepo.createPeshTokVideo({
        world_id: worldId,
        video_id: res.data.id,
        caption: caption.trim(),
        visibility: 'world',
        published_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        metadata: { theme },
      });

      // Reset & notify
      setSelectedFile(null);
      setCaption('');
      onPublished();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish video to PeshTok.';
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish to PeshTok"
      description="Share a spontaneous, vertical video moment."
    >
      <form onSubmit={handlePublish} className="mt-4 flex flex-col gap-4">
        {!selectedFile ? (
          <MediaUploadDropzone
            bucket="videos"
            accept="video/*"
            multiple={false}
            label="Drop vertical video here"
            helperText="Supports MP4, MOV, WebM (up to 500 MB)"
            onFilesSelected={handleFilesSelected}
          />
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border">
            <span className="text-xs font-medium text-primary-text truncate max-w-xs">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
            <Button size="sm" variant="secondary" onClick={() => setSelectedFile(null)}>
              Change
            </Button>
          </div>
        )}

        <Input
          label="Caption"
          placeholder="Write something playful or sweet..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Theme Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Atmospheric Theme
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  theme === t
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border text-secondary-text hover:border-accent/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
        )}

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading || !selectedFile}>
            {isUploading ? <Spinner size="sm" /> : 'Publish Video'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
