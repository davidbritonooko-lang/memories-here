-- Peshie — Her World
-- Initial Relational Database Schema
-- Specification Sections: 4, 13, 14, 15, 16, 17, 18, 19, 20, 21, 29, 30, 35, 48

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. WORLDS
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Peshie',
  access_identity TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "theme": "system",
    "music_volume": 0.8,
    "offline_preferences": {
      "auto_cache_moments": false
    }
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worlds_access_identity ON worlds(access_identity);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_world_id ON user_profiles(world_id);

-- 3. LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_world_id ON locations(world_id);

-- 4. CAPTIONS
CREATE TABLE IF NOT EXISTS captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_captions_world_id ON captions(world_id);

-- 5. CAPTION GROUPS
CREATE TABLE IF NOT EXISTS caption_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  caption_id UUID REFERENCES captions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caption_groups_world_id ON caption_groups(world_id);

-- 6. PHOTOS
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  width INT,
  height INT,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_photos_world_id ON photos(world_id);
CREATE INDEX IF NOT EXISTS idx_photos_archived_at ON photos(archived_at);

-- 7. VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds NUMERIC(8, 2) NOT NULL DEFAULT 0,
  width INT,
  height INT,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  has_audio BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_videos_world_id ON videos(world_id);
CREATE INDEX IF NOT EXISTS idx_videos_archived_at ON videos(archived_at);

-- 8. TRACKS (SOUNDTRACK)
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  track_number INT NOT NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC(8, 2) NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(world_id, track_number)
);

CREATE INDEX IF NOT EXISTS idx_tracks_world_id ON tracks(world_id);
CREATE INDEX IF NOT EXISTS idx_tracks_track_number ON tracks(track_number);

-- 9. PLAYLISTS
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_world_id ON playlists(world_id);

-- 10. PLAYLIST TRACKS (JOIN ENTITY)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_sort_order ON playlist_tracks(playlist_id, sort_order);

-- 11. MOMENTS
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  keep_offline BOOLEAN NOT NULL DEFAULT false,
  presentation_settings JSONB DEFAULT '{
    "layout": "single-hero"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moments_world_id ON moments(world_id);
CREATE INDEX IF NOT EXISTS idx_moments_archived_at ON moments(archived_at);
CREATE INDEX IF NOT EXISTS idx_moments_date ON moments(date DESC);

-- 12. MOMENT PHOTOS (JOIN ENTITY)
CREATE TABLE IF NOT EXISTS moment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  caption_id UUID REFERENCES captions(id) ON DELETE SET NULL,
  caption_group_id UUID REFERENCES caption_groups(id) ON DELETE SET NULL,
  presentation_settings JSONB DEFAULT '{}'::jsonb,
  UNIQUE(moment_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_moment_photos_moment ON moment_photos(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_photos_sort ON moment_photos(moment_id, sort_order);

-- 13. MOMENT VIDEOS (JOIN ENTITY)
CREATE TABLE IF NOT EXISTS moment_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  caption_id UUID REFERENCES captions(id) ON DELETE SET NULL,
  presentation_settings JSONB DEFAULT '{}'::jsonb,
  UNIQUE(moment_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_moment_videos_moment ON moment_videos(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_videos_sort ON moment_videos(moment_id, sort_order);

-- 14. MOMENT TRACKS (JOIN ENTITY)
CREATE TABLE IF NOT EXISTS moment_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(moment_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_moment_tracks_moment ON moment_tracks(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_tracks_sort ON moment_tracks(moment_id, sort_order);

-- 15. PESHTOK VIDEOS
CREATE TABLE IF NOT EXISTS peshtok_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'world',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_peshtok_videos_world ON peshtok_videos(world_id);
CREATE INDEX IF NOT EXISTS idx_peshtok_videos_published ON peshtok_videos(published_at DESC);

-- 16. COMMENTS (PESHTOK)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES peshtok_videos(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_simulated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- 17. LIKES (PESHTOK)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES peshtok_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);

-- 18. ARCHIVE ITEMS (SOFT DELETION AUDIT)
CREATE TABLE IF NOT EXISTS archive_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('moment', 'photo', 'video', 'track')),
  entity_id UUID NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_archive_items_world ON archive_items(world_id);
CREATE INDEX IF NOT EXISTS idx_archive_items_entity ON archive_items(entity_type, entity_id);

-- 19. OFFLINE ASSETS CACHE METADATA
CREATE TABLE IF NOT EXISTS offline_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('photo', 'video', 'audio', 'thumbnail', 'metadata')),
  cache_key TEXT NOT NULL UNIQUE,
  local_uri TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  size BIGINT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_offline_assets_world ON offline_assets(world_id);
CREATE INDEX IF NOT EXISTS idx_offline_assets_entity ON offline_assets(entity_type, entity_id);

-- ROW LEVEL SECURITY
-- Policies are applied by 003_private_world_auth.sql. Tables remain closed
-- between migrations rather than granting unrestricted anonymous access.
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caption_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE peshtok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_assets ENABLE ROW LEVEL SECURITY;
