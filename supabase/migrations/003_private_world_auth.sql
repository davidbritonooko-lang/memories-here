-- Private world authorization.
-- Access keys are only used by the server to issue short-lived, world-scoped
-- JWTs. Browser clients never receive the service-role key.

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS access_identity_hash TEXT;

UPDATE public.worlds
SET access_identity_hash = encode(digest(access_identity, 'sha256'), 'hex')
WHERE access_identity_hash IS NULL;

ALTER TABLE public.worlds
  ALTER COLUMN access_identity_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_worlds_access_identity_hash
  ON public.worlds(access_identity_hash);

DROP INDEX IF EXISTS public.idx_worlds_access_identity;
ALTER TABLE public.worlds DROP COLUMN IF EXISTS access_identity;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'worlds', 'user_profiles', 'locations', 'captions', 'caption_groups',
        'photos', 'videos', 'tracks', 'playlists', 'playlist_tracks', 'moments',
        'moment_photos', 'moment_videos', 'moment_tracks', 'peshtok_videos',
        'comments', 'likes', 'archive_items', 'offline_assets'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  END LOOP;
END;
$$;

REVOKE ALL ON TABLE
  public.user_profiles, public.locations, public.captions, public.caption_groups,
  public.photos, public.videos, public.tracks, public.playlists,
  public.playlist_tracks, public.moments, public.moment_photos, public.moment_videos,
  public.moment_tracks, public.peshtok_videos, public.comments, public.likes,
  public.archive_items, public.offline_assets
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_profiles, public.locations, public.captions, public.caption_groups,
  public.photos, public.videos, public.tracks, public.playlists,
  public.playlist_tracks, public.moments, public.moment_photos, public.moment_videos,
  public.moment_tracks, public.peshtok_videos, public.comments, public.likes,
  public.archive_items, public.offline_assets
TO authenticated;

REVOKE ALL ON TABLE public.worlds FROM anon, authenticated;
GRANT SELECT (id, display_name, preferences, created_at, updated_at)
  ON TABLE public.worlds TO authenticated;

CREATE POLICY world_owner_read ON public.worlds
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY user_profiles_world_access ON public.user_profiles
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY locations_world_access ON public.locations
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY captions_world_access ON public.captions
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY caption_groups_world_access ON public.caption_groups
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (
    world_id = (SELECT auth.uid())
    AND (
      caption_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.captions c
        WHERE c.id = caption_id AND c.world_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY photos_world_access ON public.photos
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY videos_world_access ON public.videos
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY tracks_world_access ON public.tracks
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY playlists_world_access ON public.playlists
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY playlist_tracks_world_access ON public.playlist_tracks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND t.world_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND t.world_id = (SELECT auth.uid())
    )
  );

CREATE POLICY moments_world_access ON public.moments
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (
    world_id = (SELECT auth.uid())
    AND (
      location_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.locations l
        WHERE l.id = location_id AND l.world_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY moment_photos_world_access ON public.moment_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.photos p
      WHERE p.id = photo_id AND p.world_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.photos p
      WHERE p.id = photo_id AND p.world_id = (SELECT auth.uid())
    )
    AND (
      caption_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.captions c
        WHERE c.id = caption_id AND c.world_id = (SELECT auth.uid())
      )
    )
    AND (
      caption_group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.caption_groups cg
        WHERE cg.id = caption_group_id AND cg.world_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY moment_videos_world_access ON public.moment_videos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.world_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.world_id = (SELECT auth.uid())
    )
    AND (
      caption_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.captions c
        WHERE c.id = caption_id AND c.world_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY moment_tracks_world_access ON public.moment_tracks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND t.world_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = moment_id AND m.world_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id AND t.world_id = (SELECT auth.uid())
    )
  );

CREATE POLICY peshtok_videos_world_access ON public.peshtok_videos
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (
    world_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.world_id = (SELECT auth.uid())
    )
  );

CREATE POLICY comments_world_access ON public.comments
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (
    world_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.peshtok_videos pv
      WHERE pv.id = video_id AND pv.world_id = (SELECT auth.uid())
    )
  );

CREATE POLICY likes_world_access ON public.likes
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (
    world_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.peshtok_videos pv
      WHERE pv.id = video_id AND pv.world_id = (SELECT auth.uid())
    )
  );

CREATE POLICY archive_items_world_access ON public.archive_items
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE POLICY offline_assets_world_access ON public.offline_assets
  FOR ALL TO authenticated
  USING (world_id = (SELECT auth.uid()))
  WITH CHECK (world_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.archive_world_entity(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_restore BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_world_id UUID := auth.uid();
  v_updated_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF v_world_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  CASE p_entity_type
    WHEN 'moment' THEN
      UPDATE public.moments
      SET archived_at = CASE WHEN p_restore THEN NULL ELSE v_now END,
          updated_at = v_now
      WHERE id = p_entity_id
        AND world_id = v_world_id
        AND ((p_restore AND archived_at IS NOT NULL) OR (NOT p_restore AND archived_at IS NULL))
      RETURNING id INTO v_updated_id;
    WHEN 'photo' THEN
      UPDATE public.photos
      SET archived_at = CASE WHEN p_restore THEN NULL ELSE v_now END
      WHERE id = p_entity_id
        AND world_id = v_world_id
        AND ((p_restore AND archived_at IS NOT NULL) OR (NOT p_restore AND archived_at IS NULL))
      RETURNING id INTO v_updated_id;
    WHEN 'video' THEN
      UPDATE public.videos
      SET archived_at = CASE WHEN p_restore THEN NULL ELSE v_now END
      WHERE id = p_entity_id
        AND world_id = v_world_id
        AND ((p_restore AND archived_at IS NOT NULL) OR (NOT p_restore AND archived_at IS NULL))
      RETURNING id INTO v_updated_id;
    WHEN 'track' THEN
      UPDATE public.tracks
      SET archived_at = CASE WHEN p_restore THEN NULL ELSE v_now END
      WHERE id = p_entity_id
        AND world_id = v_world_id
        AND ((p_restore AND archived_at IS NOT NULL) OR (NOT p_restore AND archived_at IS NULL))
      RETURNING id INTO v_updated_id;
    ELSE
      RAISE EXCEPTION 'Unsupported archive entity type';
  END CASE;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Entity was not found or is already in the requested archive state';
  END IF;

  IF p_restore THEN
    UPDATE public.archive_items
    SET restored_at = v_now
    WHERE world_id = v_world_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND restored_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No active archive record exists for this entity';
    END IF;
  ELSE
    INSERT INTO public.archive_items (world_id, entity_type, entity_id, archived_at)
    VALUES (v_world_id, p_entity_type, p_entity_id, v_now);
  END IF;

  RETURN v_updated_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_next_track(
  p_title TEXT,
  p_storage_path TEXT,
  p_mime_type TEXT,
  p_file_size BIGINT
)
RETURNS SETOF public.tracks
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_world_id UUID := auth.uid();
  v_track_number INTEGER;
  v_title TEXT;
BEGIN
  IF v_world_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_storage_path !~ ('^' || v_world_id::text || '/audio/') THEN
    RAISE EXCEPTION 'Track storage path does not belong to this world';
  END IF;
  IF p_file_size <= 0 THEN
    RAISE EXCEPTION 'Track file size must be positive';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_world_id::text, 0));
  SELECT COALESCE(MAX(track_number), 0) + 1
  INTO v_track_number
  FROM public.tracks
  WHERE world_id = v_world_id;

  v_title := COALESCE(
    NULLIF(btrim(p_title), ''),
    'TRACK ' || CASE
      WHEN v_track_number < 10 THEN '0' || v_track_number::text
      ELSE v_track_number::text
    END
  );

  RETURN QUERY
  INSERT INTO public.tracks (
    world_id, track_number, title, storage_path, mime_type, file_size
  )
  VALUES (
    v_world_id, v_track_number, v_title, p_storage_path, p_mime_type, p_file_size
  )
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_world_entity(TEXT, UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_next_track(TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_world_entity(TEXT, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_next_track(TEXT, TEXT, TEXT, BIGINT) TO authenticated;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = ANY (ARRAY[
        'Allow authenticated photo upload', 'Allow authenticated photo read',
        'Allow authenticated photo update', 'Allow authenticated photo delete',
        'Allow authenticated video upload', 'Allow authenticated video read',
        'Allow authenticated video update', 'Allow authenticated video delete',
        'Allow authenticated audio upload', 'Allow authenticated audio read',
        'Allow authenticated audio update', 'Allow authenticated audio delete',
        'Allow authenticated thumbnail upload', 'Allow authenticated thumbnail read',
        'Allow authenticated thumbnail update', 'Allow authenticated thumbnail delete'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON storage.objects',
      existing_policy.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY photos_world_storage_access ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'photos' AND split_part(name, '/', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'photos' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE POLICY videos_world_storage_access ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'videos' AND split_part(name, '/', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'videos' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE POLICY audio_world_storage_access ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'audio' AND split_part(name, '/', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'audio' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE POLICY thumbnails_world_storage_access ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'thumbnails' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);
