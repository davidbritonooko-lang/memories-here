'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Film, Music } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import { MediaUploadDropzone } from '@/components/media/media-upload-dropzone';
import { uploadAndRegisterPhoto, uploadAndRegisterVideo } from '@/lib/media/service';
import { soundtrackRepo } from '@/lib/supabase/db';
import type { Track } from '@/types';
import { formatTrackTitle } from '@/features/soundtrack/utils';

export interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  momentId: string;
  existingPhotoCount: number;
  existingVideoCount: number;
  existingTrackCount: number;
  onPhotoAdded: (photoId: string, sortOrder: number) => Promise<void>;
  onVideoAdded: (videoId: string, sortOrder: number) => Promise<void>;
  onTrackAdded: (trackId: string, sortOrder: number) => Promise<void>;
}

export function AddMediaModal({
  isOpen,
  onClose,
  worldId,
  existingPhotoCount,
  existingVideoCount,
  existingTrackCount,
  onPhotoAdded,
  onVideoAdded,
  onTrackAdded,
}: AddMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'soundtrack'>('photos');
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'soundtrack') {
      void (async () => {
        setIsLoadingTracks(true);
        try {
          const res = await soundtrackRepo.listTracks(worldId);
          setAvailableTracks((res || []) as unknown as Track[]);
        } catch {
          setAvailableTracks([]);
        } finally {
          setIsLoadingTracks(false);
        }
      })();
    }
  }, [isOpen, activeTab, worldId]);

  const handlePhotoUpload = async (files: File[]) => {
    setIsProcessing(true);
    setStatusMessage(`Uploading ${files.length} photo(s)...`);
    try {
      let order = existingPhotoCount;
      for (const file of files) {
        const res = await uploadAndRegisterPhoto(worldId, file);
        if (res.data) {
          await onPhotoAdded(res.data.id, order);
          order++;
        }
      }
      onClose();
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleVideoUpload = async (files: File[]) => {
    setIsProcessing(true);
    setStatusMessage(`Uploading ${files.length} video(s)...`);
    try {
      let order = existingVideoCount;
      for (const file of files) {
        const res = await uploadAndRegisterVideo(worldId, file);
        if (res.data) {
          await onVideoAdded(res.data.id, order);
          order++;
        }
      }
      onClose();
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleSelectTrack = async (track: Track) => {
    setIsProcessing(true);
    try {
      await onTrackAdded(track.id, existingTrackCount);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Media to Moment"
      description="Attach photographs, videos, or atmospheric soundtrack tracks."
    >
      <div className="mt-4 flex flex-col gap-4">
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'photos' | 'videos' | 'soundtrack')}
          tabs={[
            { id: 'photos', label: 'Photos', icon: <Camera className="w-4 h-4" /> },
            { id: 'videos', label: 'Videos', icon: <Film className="w-4 h-4" /> },
            { id: 'soundtrack', label: 'Soundtrack', icon: <Music className="w-4 h-4" /> },
          ]}
        />

        {isProcessing && (
          <div className="flex items-center justify-center p-6 gap-3 rounded-2xl bg-surface border border-border">
            <Spinner size="md" />
            <span className="text-sm text-secondary-text">{statusMessage || 'Processing media...'}</span>
          </div>
        )}

        {!isProcessing && activeTab === 'photos' && (
          <MediaUploadDropzone
            bucket="photos"
            accept="image/*"
            multiple
            label="Drop photos here"
            helperText="Supports JPEG, PNG, WebP, GIF, HEIC (up to 50 MB each)"
            onFilesSelected={handlePhotoUpload}
          />
        )}

        {!isProcessing && activeTab === 'videos' && (
          <MediaUploadDropzone
            bucket="videos"
            accept="video/*"
            multiple
            label="Drop videos here"
            helperText="Supports MP4, MOV, WebM (up to 500 MB each)"
            onFilesSelected={handleVideoUpload}
          />
        )}

        {!isProcessing && activeTab === 'soundtrack' && (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {isLoadingTracks ? (
              <div className="p-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : availableTracks.length === 0 ? (
              <p className="text-sm text-center py-6 text-muted-text">
                No tracks in soundtrack yet. Upload some in the Soundtrack section first.
              </p>
            ) : (
              availableTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-xs font-medium text-primary-text truncate">
                      {formatTrackTitle(track.track_number, track.title)}
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleSelectTrack(track)}>
                    Attach
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
