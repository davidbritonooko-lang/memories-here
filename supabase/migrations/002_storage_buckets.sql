-- Peshie — Her World
-- Storage Buckets Migration
-- Specification Sections: 4, 16, 17, 20, 35, 48
--
-- Supabase Storage uses its own schema (storage.buckets, storage.objects).
-- This migration creates the required private storage buckets and
-- access policies for media uploads.

-- 1. PHOTO STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']
) ON CONFLICT (id) DO NOTHING;

-- 2. VIDEO STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  524288000, -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
) ON CONFLICT (id) DO NOTHING;

-- 3. AUDIO / SOUNDTRACK STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false,
  104857600, -- 100 MB
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/x-m4a']
) ON CONFLICT (id) DO NOTHING;

-- 4. THUMBNAILS STORAGE BUCKET (generated previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- Every object is scoped to the UUID in the first path segment of the
-- authenticated world JWT. Migration 003 reapplies these policies as part of
-- the database authorization migration.
-- ============================================================

-- Photos bucket policies
CREATE POLICY "Allow authenticated photo upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated photo read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'photos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated photo update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'photos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated photo delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'photos' AND split_part(name, '/', 1) = auth.uid()::text);

-- Videos bucket policies
CREATE POLICY "Allow authenticated video upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated video read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'videos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated video update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'videos' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated video delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'videos' AND split_part(name, '/', 1) = auth.uid()::text);

-- Audio bucket policies
CREATE POLICY "Allow authenticated audio upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated audio read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'audio' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated audio update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'audio' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'audio' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated audio delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'audio' AND split_part(name, '/', 1) = auth.uid()::text);

-- Thumbnails bucket policies
CREATE POLICY "Allow authenticated thumbnail upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated thumbnail read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated thumbnail update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Allow authenticated thumbnail delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = auth.uid()::text);
