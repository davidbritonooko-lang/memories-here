'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Music, Upload, Plus, ListMusic, Sparkles } from 'lucide-react';
import { useMusic } from '@/engines/music';
import { useWorldIdentity } from '@/features/identity';
import { soundtrackRepo, playlistsRepo } from '@/lib/supabase/db';
import { uploadAndRegisterTrack } from '@/lib/media/service';
import { getSignedUrl } from '@/lib/storage/client';
import type { Track, Playlist } from '@/types';
import { TrackItem } from '@/features/soundtrack/TrackItem';
import { PlayerBar } from '@/features/soundtrack/PlayerBar';
import { formatTrackTitle, sortTracksByNumber } from '@/features/soundtrack/utils';
import { MediaUploadDropzone } from '@/components/media/media-upload-dropzone';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

export default function SoundtrackPage() {
  const { identity } = useWorldIdentity();
  const { engine, state: musicState } = useMusic();
  const { showToast } = useToast();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const worldId = identity?.worldId;

  // Load tracks and playlists
  const loadLibrary = useCallback(async () => {
    if (!worldId) return;
    setIsLoading(true);
    try {
      const [tracksData, playlistsData] = await Promise.all([
        soundtrackRepo.listTracks(worldId),
        playlistsRepo.listByWorld(worldId),
      ]);
      setTracks(sortTracksByNumber((tracksData || []) as unknown as Track[]));
      setPlaylists((playlistsData || []) as unknown as Playlist[]);
    } catch {
      showToast("Couldn't load your soundtrack library.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [worldId, showToast]);

  useEffect(() => {
    void (async () => {
      await loadLibrary();
    })();
  }, [loadLibrary]);

  const handlePlayTrack = async (track: Track) => {
    try {
      engine.requestContext('soundtrack');
      let audioUrl = track.storage_path;
      if (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:')) {
        const signedRes = await getSignedUrl('audio', track.storage_path);
        if (signedRes.error || !signedRes.url) {
          throw new Error(signedRes.error?.userMessage || 'The track link could not be created.');
        }
        audioUrl = signedRes.url;
      }
      await engine.load(track, audioUrl, true);
    } catch {
      showToast("Couldn't play this track right now.", 'error');
    }
  };

  const handlePauseTrack = () => {
    engine.pause();
  };

  const handleArchiveTrack = async (track: Track) => {
    if (!worldId) {
      showToast("Couldn't identify your private world.", 'error');
      return;
    }

    try {
      await soundtrackRepo.softDelete(track.id);
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
      showToast(`${formatTrackTitle(track.track_number)} moved to Archive.`, 'success');
    } catch {
      showToast("Couldn't archive this track.", 'error');
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (!worldId) {
      showToast("Couldn't identify your private world.", 'error');
      return;
    }

    setShowUploadModal(false);
    showToast(`Uploading ${files.length} track(s)...`, 'info');

    let successCount = 0;
    for (const file of files) {
      const res = await uploadAndRegisterTrack(worldId, file);
      if (res.data) {
        successCount++;
      }
    }

    if (successCount > 0) {
      showToast(`Added ${successCount} new track(s) to your Soundtrack.`, 'success');
      loadLibrary();
    } else {
      showToast('Upload could not be completed.', 'error');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    if (!worldId) {
      showToast("Couldn't identify your private world.", 'error');
      return;
    }

    try {
      setIsCreatingPlaylist(true);
      const created = await playlistsRepo.create({
        world_id: worldId,
        title: newPlaylistTitle.trim(),
      });
      setPlaylists((prev) => [created as unknown as Playlist, ...prev]);
      setNewPlaylistTitle('');
      setShowPlaylistModal(false);
      showToast('New playlist created.', 'success');
    } catch {
      showToast("Couldn't create playlist.", 'error');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const [first, ...rest] = tracks;
    engine.clearQueue();
    engine.queue(rest);
    handlePlayTrack(first);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <Music className="w-5 h-5" />
            </span>
            <h1 className="font-editorial text-3xl font-semibold text-primary-text tracking-tight">
              Soundtrack
            </h1>
          </div>
          <p className="mt-1 text-sm text-secondary-text">
            Atmospheric music for your private archive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {tracks.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handlePlayAll}>
              <Sparkles className="w-4 h-4 mr-1.5 text-accent" />
              Play All
            </Button>
          )}

          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-1.5" />
            Add Track
          </Button>
        </div>
      </div>

      {/* Playlists Horizontal Bar */}
      {playlists.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
              Curated Playlists
            </span>
            <button
              type="button"
              onClick={() => setShowPlaylistModal(true)}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Playlist
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-primary-text shrink-0 hover:border-accent/40 cursor-pointer"
              >
                <ListMusic className="w-3.5 h-3.5 text-accent" />
                <span>{playlist.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Track List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Tracks ({tracks.length})
          </span>
          {playlists.length === 0 && (
            <button
              type="button"
              onClick={() => setShowPlaylistModal(true)}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create Playlist
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Spinner size="lg" />
            <p className="mt-3 text-xs text-muted-text">Loading your soundtrack...</p>
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={<Music className="w-6 h-6" />}
            title="No soundtrack tracks yet"
            description="Upload music to accompany your moments and memories."
            action={
              <Button size="sm" onClick={() => setShowUploadModal(true)}>
                Upload First Track
              </Button>
            }
          />
        ) : (
          <div role="list" className="flex flex-col gap-2">
            {tracks.map((track) => {
              const isActive = musicState.currentTrack?.id === track.id;
              const isPlaying = isActive && musicState.playbackState === 'playing';

              return (
                <TrackItem
                  key={track.id}
                  track={track}
                  isActive={isActive}
                  isPlaying={isPlaying}
                  onPlay={handlePlayTrack}
                  onPause={handlePauseTrack}
                  onArchive={handleArchiveTrack}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Soundtrack Track"
        description="Music will be automatically assigned sequential track numbers (TRACK 01, TRACK 02...)."
      >
        <div className="mt-4">
          <MediaUploadDropzone
            bucket="audio"
            accept="audio/*"
            multiple={true}
            label="Drop audio tracks here"
            helperText="Supports MP3, M4A, WAV, AAC, and FLAC (up to 100 MB each)"
            onFilesSelected={handleFilesSelected}
          />
        </div>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        title="Create Playlist"
        description="Group atmospheric tracks together for specific themes or memory sequences."
      >
        <form onSubmit={handleCreatePlaylist} className="mt-4 flex flex-col gap-4">
          <Input
            label="Playlist Title"
            placeholder="e.g. Late Night Drives, Sunday Mornings"
            value={newPlaylistTitle}
            onChange={(e) => setNewPlaylistTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPlaylistModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingPlaylist || !newPlaylistTitle.trim()}>
              {isCreatingPlaylist ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Floating Global Audio Player */}
      <PlayerBar />
    </div>
  );
}
