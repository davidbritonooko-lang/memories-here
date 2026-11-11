-- Durable outbox for deleting private Storage objects after an archived media
-- record is purged. The database transaction records cleanup work before it
-- deletes metadata; a server-side worker performs the Storage API operation.

CREATE TABLE IF NOT EXISTS public.storage_cleanup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL CHECK (bucket_id IN ('photos', 'videos', 'audio', 'thumbnails')),
  object_path TEXT NOT NULL CHECK (length(btrim(object_path)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (world_id, bucket_id, object_path)
);

ALTER TABLE public.storage_cleanup_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.storage_cleanup_jobs FROM anon, authenticated;
GRANT ALL ON TABLE public.storage_cleanup_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.purge_archived_world_entity(
  p_archive_item_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_world_id UUID := auth.uid();
  v_deleted_id UUID;
  v_storage_path TEXT;
  v_thumbnail_path TEXT;
BEGIN
  IF v_world_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM 1
  FROM public.archive_items
  WHERE id = p_archive_item_id
    AND world_id = v_world_id
    AND entity_type::text = p_entity_type
    AND entity_id = p_entity_id
    AND restored_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active archive record was not found';
  END IF;

  CASE p_entity_type
    WHEN 'moment' THEN
      DELETE FROM public.moments
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    WHEN 'photo' THEN
      SELECT storage_path, thumbnail_path
      INTO v_storage_path, v_thumbnail_path
      FROM public.photos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Archived photo was not found';
      END IF;
      IF v_storage_path !~ ('^' || v_world_id::text || '/photos/') THEN
        RAISE EXCEPTION 'Photo storage path is outside the owning world';
      END IF;
      IF v_thumbnail_path IS NOT NULL
        AND v_thumbnail_path !~ ('^' || v_world_id::text || '/thumbnails/') THEN
        RAISE EXCEPTION 'Photo thumbnail path is outside the owning world';
      END IF;

      INSERT INTO public.storage_cleanup_jobs (world_id, bucket_id, object_path)
      VALUES (v_world_id, 'photos', v_storage_path)
      ON CONFLICT (world_id, bucket_id, object_path) DO NOTHING;

      IF v_thumbnail_path IS NOT NULL AND length(btrim(v_thumbnail_path)) > 0 THEN
        INSERT INTO public.storage_cleanup_jobs (world_id, bucket_id, object_path)
        VALUES (v_world_id, 'thumbnails', v_thumbnail_path)
        ON CONFLICT (world_id, bucket_id, object_path) DO NOTHING;
      END IF;

      DELETE FROM public.photos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    WHEN 'video' THEN
      SELECT storage_path, thumbnail_path
      INTO v_storage_path, v_thumbnail_path
      FROM public.videos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Archived video was not found';
      END IF;
      IF v_storage_path !~ ('^' || v_world_id::text || '/videos/') THEN
        RAISE EXCEPTION 'Video storage path is outside the owning world';
      END IF;
      IF v_thumbnail_path IS NOT NULL
        AND v_thumbnail_path !~ ('^' || v_world_id::text || '/thumbnails/') THEN
        RAISE EXCEPTION 'Video thumbnail path is outside the owning world';
      END IF;

      INSERT INTO public.storage_cleanup_jobs (world_id, bucket_id, object_path)
      VALUES (v_world_id, 'videos', v_storage_path)
      ON CONFLICT (world_id, bucket_id, object_path) DO NOTHING;

      IF v_thumbnail_path IS NOT NULL AND length(btrim(v_thumbnail_path)) > 0 THEN
        INSERT INTO public.storage_cleanup_jobs (world_id, bucket_id, object_path)
        VALUES (v_world_id, 'thumbnails', v_thumbnail_path)
        ON CONFLICT (world_id, bucket_id, object_path) DO NOTHING;
      END IF;

      DELETE FROM public.videos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    WHEN 'track' THEN
      SELECT storage_path INTO v_storage_path
      FROM public.tracks
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Archived track was not found';
      END IF;
      IF v_storage_path !~ ('^' || v_world_id::text || '/audio/') THEN
        RAISE EXCEPTION 'Track storage path is outside the owning world';
      END IF;

      INSERT INTO public.storage_cleanup_jobs (world_id, bucket_id, object_path)
      VALUES (v_world_id, 'audio', v_storage_path)
      ON CONFLICT (world_id, bucket_id, object_path) DO NOTHING;

      DELETE FROM public.tracks
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    ELSE
      RAISE EXCEPTION 'Unsupported archive entity type';
  END CASE;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'Archived entity was not found';
  END IF;

  DELETE FROM public.archive_items
  WHERE id = p_archive_item_id
    AND world_id = v_world_id
    AND restored_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archive audit record could not be deleted';
  END IF;

  RETURN v_deleted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_archived_world_entity(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_archived_world_entity(UUID, TEXT, UUID) TO authenticated;
