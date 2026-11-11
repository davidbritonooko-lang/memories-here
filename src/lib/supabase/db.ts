import { getSupabaseBrowserClient } from './client';
import type { Database } from './types';
import type { WorldPreferences } from '@/types';

type Tables = Database['public']['Tables'];

type ArchiveEntityType = Tables['archive_items']['Insert']['entity_type'];

function isArchiveEntityType(value: string): value is ArchiveEntityType {
  return value === 'moment' || value === 'photo' || value === 'video' || value === 'track';
}

async function setArchivedState(
  entityType: ArchiveEntityType,
  entityId: string,
  restore = false
) {
  const { data, error } = await getSupabaseBrowserClient().rpc('archive_world_entity', {
    p_entity_id: entityId,
    p_entity_type: entityType,
    p_restore: restore,
  });
  if (error) throw error;
  return data;
}

export const worldRepo = {
  async getByAccessIdentity(accessIdentityHash: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('access_identity_hash', accessIdentityHash)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertWorld(displayName: string, accessIdentityHash: string, preferences?: WorldPreferences) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('worlds')
      .upsert(
        {
          display_name: displayName,
          access_identity_hash: accessIdentityHash,
          preferences: (preferences as unknown as Tables['worlds']['Insert']['preferences']) || undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'access_identity_hash' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePreferences(worldId: string, preferences: WorldPreferences) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('worlds')
      .update({
        preferences: preferences as unknown as Tables['worlds']['Update']['preferences'],
        updated_at: new Date().toISOString(),
      })
      .eq('id', worldId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const momentsRepo = {
  async listByWorld(worldId: string, includeArchived = false) {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('moments')
      .select(`
        *,
        location:locations(*),
        moment_photos(
          id, sort_order, presentation_settings,
          photo:photos(*)
        ),
        moment_videos(
          id, sort_order, presentation_settings,
          video:videos(*)
        ),
        moment_tracks(
          id, sort_order,
          track:tracks(*)
        )
      `)
      .eq('world_id', worldId)
      .order('date', { ascending: false });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(momentId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moments')
      .select(`
        *,
        location:locations(*),
        moment_photos(
          id, sort_order, presentation_settings,
          photo:photos(*),
          caption:captions(*)
        ),
        moment_videos(
          id, sort_order, presentation_settings,
          video:videos(*),
          caption:captions(*)
        ),
        moment_tracks(
          id, sort_order,
          track:tracks(*)
        )
      `)
      .eq('id', momentId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload: Tables['moments']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moments')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async softDelete(momentId: string, ..._rest: unknown[]) {
    return setArchivedState('moment', momentId);
  },

  async restore(momentId: string) {
    return setArchivedState('moment', momentId, true);
  },

  async update(momentId: string, updates: Tables['moments']['Update']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', momentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addPhoto(momentId: string, photoId: string, sortOrder: number) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moment_photos')
      .insert({ moment_id: momentId, photo_id: photoId, sort_order: sortOrder })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removePhoto(momentPhotoId: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('moment_photos')
      .delete()
      .eq('id', momentPhotoId);

    if (error) throw error;
  },

  async addVideo(momentId: string, videoId: string, sortOrder: number) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moment_videos')
      .insert({ moment_id: momentId, video_id: videoId, sort_order: sortOrder })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeVideo(momentVideoId: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('moment_videos')
      .delete()
      .eq('id', momentVideoId);

    if (error) throw error;
  },

  async addTrack(momentId: string, trackId: string, sortOrder: number) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('moment_tracks')
      .insert({ moment_id: momentId, track_id: trackId, sort_order: sortOrder })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeTrack(momentTrackId: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('moment_tracks')
      .delete()
      .eq('id', momentTrackId);

    if (error) throw error;
  },
};

export const soundtrackRepo = {
  async listTracks(worldId: string, includeArchived = false) {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('tracks')
      .select('*')
      .eq('world_id', worldId)
      .order('track_number', { ascending: true });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createNextTrack(payload: {
    title: string | null;
    storage_path: string;
    mime_type: string;
    file_size: number;
  }) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .rpc('create_next_track', {
        p_title: payload.title,
        p_storage_path: payload.storage_path,
        p_mime_type: payload.mime_type ?? 'audio/mpeg',
        p_file_size: payload.file_size ?? 0,
      })
      .single();

    if (error) throw error;
    return data;
  },

  async updateTrack(trackId: string, updates: Tables['tracks']['Update']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('tracks')
      .update(updates)
      .eq('id', trackId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDelete(trackId: string) {
    return setArchivedState('track', trackId);
  },

  async restore(trackId: string) {
    return setArchivedState('track', trackId, true);
  },
};

export const playlistsRepo = {
  async listByWorld(worldId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(
          id, sort_order,
          track:tracks(*)
        )
      `)
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(playlistId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(
          id, sort_order,
          track:tracks(*)
        )
      `)
      .eq('id', playlistId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload: Tables['playlists']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('playlists')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addTrackToPlaylist(playlistId: string, trackId: string, sortOrder: number) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;
  },

  async delete(playlistId: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
  },
};

export const peshtokRepo = {
  async listFeed(worldId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('peshtok_videos')
      .select(`
        *,
        video:videos(*)
      `)
      .eq('world_id', worldId)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async listComments(videoId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addComment(payload: Tables['comments']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('comments')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPeshTokVideo(payload: Tables['peshtok_videos']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('peshtok_videos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleLike(worldId: string, videoId: string): Promise<{ liked: boolean; count: number }> {
    const supabase = getSupabaseBrowserClient();
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('world_id', worldId)
      .eq('video_id', videoId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return { liked: false, count: -1 };
    } else {
      await supabase.from('likes').insert({ world_id: worldId, video_id: videoId });
      return { liked: true, count: 1 };
    }
  },

  async deletePeshTokVideo(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('peshtok_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const archiveRepo = {
  async listArchive(worldId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('archive_items')
      .select('*')
      .eq('world_id', worldId)
      .is('restored_at', null)
      .order('archived_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async restoreItem(
    archiveItemId: string,
    entityType: string,
    entityId: string
  ) {
    if (!isArchiveEntityType(entityType)) {
      throw new Error('Unsupported archive entity type.');
    }

    const { data, error } = await getSupabaseBrowserClient().rpc(
      'restore_archived_world_entity',
      {
        p_archive_item_id: archiveItemId,
        p_entity_id: entityId,
        p_entity_type: entityType,
      }
    );

    if (error) throw error;
    return data;
  },

  async permanentlyDelete(
    archiveItemId: string,
    entityType: string,
    entityId: string
  ) {
    if (!isArchiveEntityType(entityType)) {
      throw new Error('Unsupported archive entity type.');
    }

    const { data, error } = await getSupabaseBrowserClient().rpc(
      'purge_archived_world_entity',
      {
        p_archive_item_id: archiveItemId,
        p_entity_id: entityId,
        p_entity_type: entityType,
      }
    );

    if (error) throw error;
    return data;
  },
};

export const photosRepo = {
  async listByWorld(worldId: string, includeArchived = false) {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('photos')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(photoId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(payload: Tables['photos']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('photos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDelete(photoId: string) {
    return setArchivedState('photo', photoId);
  },

  async restore(photoId: string) {
    return setArchivedState('photo', photoId, true);
  },
};

export const videosRepo = {
  async listByWorld(worldId: string, includeArchived = false) {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('videos')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(videoId: string) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(payload: Tables['videos']['Insert']) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('videos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDelete(videoId: string) {
    return setArchivedState('video', videoId);
  },

  async restore(videoId: string) {
    return setArchivedState('video', videoId, true);
  },
};
