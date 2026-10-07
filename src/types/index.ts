/**
 * Core Data Models & Domain Types for Peshie — Her World
 * Specification Sections: 6, 7, 10, 13-21, 29, 30, 35
 */

export type ThemePreference = 'system' | 'light' | 'dark';

export interface WorldPreferences {
  theme: ThemePreference;
  music_volume: number; // 0.0 to 1.0
  offline_preferences: {
    auto_cache_moments: boolean;
    max_storage_mb?: number;
  };
}

export interface World {
  id: string;
  display_name: string;
  access_identity: string; // High-entropy unguessable identifier
  preferences: WorldPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  world_id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  world_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Caption {
  id: string;
  world_id: string;
  text: string;
  created_at: string;
}

export interface CaptionGroup {
  id: string;
  world_id: string;
  name: string;
  caption_id: string;
  created_at: string;
}

export interface Photo {
  id: string;
  world_id: string;
  storage_path: string;
  thumbnail_path?: string;
  width?: number;
  height?: number;
  mime_type: string;
  file_size: number;
  created_at: string;
  archived_at?: string | null;
}

export interface Video {
  id: string;
  world_id: string;
  storage_path: string;
  thumbnail_path?: string;
  duration_seconds: number;
  width?: number;
  height?: number;
  mime_type: string;
  file_size: number;
  has_audio: boolean;
  created_at: string;
  archived_at?: string | null;
}

export interface Track {
  id: string;
  world_id: string;
  track_number: number;
  title: string;
  storage_path: string;
  duration_seconds: number;
  mime_type: string;
  file_size: number;
  created_at: string;
  archived_at?: string | null;
}

export interface Playlist {
  id: string;
  world_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  sort_order: number;
}

export type MomentLayoutType =
  | 'single-hero'
  | 'two-up'
  | 'three-grid'
  | 'film-strip'
  | 'portrait-feature'
  | 'mixed-collage';

export interface MomentPresentationSettings {
  layout?: MomentLayoutType;
  filter?: string;
  aspect_ratio?: string;
}

export interface Moment {
  id: string;
  world_id: string;
  title: string;
  date: string;
  location_id?: string | null;
  location?: Location;
  is_draft: boolean;
  keep_offline?: boolean;
  presentation_settings?: MomentPresentationSettings;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface MomentPhoto {
  id: string;
  moment_id: string;
  photo_id: string;
  photo?: Photo;
  sort_order: number;
  caption_id?: string | null;
  caption_group_id?: string | null;
  presentation_settings?: Record<string, unknown>;
}

export interface MomentVideo {
  id: string;
  moment_id: string;
  video_id: string;
  video?: Video;
  sort_order: number;
  caption_id?: string | null;
  presentation_settings?: Record<string, unknown>;
}

export interface MomentTrack {
  id: string;
  moment_id: string;
  track_id: string;
  track?: Track;
  sort_order: number;
}

export type PeshTokProfileTheme =
  | 'Soft'
  | 'Midnight'
  | 'Playful'
  | 'Afterglow'
  | 'Monochrome';

export interface PeshTokVideo {
  id: string;
  world_id: string;
  video_id: string;
  video?: Video;
  caption: string;
  visibility: 'private' | 'world';
  published_at: string;
  likes_count: number;
  comments_count: number;
  metadata?: Record<string, unknown>;
}

export interface Comment {
  id: string;
  world_id: string;
  video_id: string;
  author_name: string;
  content: string;
  is_simulated: boolean;
  created_at: string;
}

export interface Like {
  id: string;
  world_id: string;
  video_id: string;
  created_at: string;
}

export type EntityType = 'moment' | 'photo' | 'video' | 'track';

export interface ArchiveItem {
  id: string;
  world_id: string;
  entity_type: EntityType;
  entity_id: string;
  archived_at: string;
  restored_at?: string | null;
}

export type AssetType = 'photo' | 'video' | 'audio' | 'thumbnail' | 'metadata';

export interface OfflineAsset {
  id: string;
  entity_type: EntityType | 'peshtok';
  entity_id: string;
  asset_type: AssetType;
  cache_key: string;
  local_uri?: string;
  downloaded_at: string;
  size: number;
  version: number;
}
