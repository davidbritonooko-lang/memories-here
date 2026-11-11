-- Keep archive entity state and its audit row in the same database transaction.
-- These functions operate only on the authenticated world's own archived records.

CREATE OR REPLACE FUNCTION public.restore_archived_world_entity(
  p_archive_item_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
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
      UPDATE public.moments
      SET archived_at = NULL, updated_at = v_now
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_updated_id;
    WHEN 'photo' THEN
      UPDATE public.photos
      SET archived_at = NULL
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_updated_id;
    WHEN 'video' THEN
      UPDATE public.videos
      SET archived_at = NULL
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_updated_id;
    WHEN 'track' THEN
      UPDATE public.tracks
      SET archived_at = NULL
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_updated_id;
    ELSE
      RAISE EXCEPTION 'Unsupported archive entity type';
  END CASE;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Archived entity was not found';
  END IF;

  UPDATE public.archive_items
  SET restored_at = v_now
  WHERE id = p_archive_item_id
    AND world_id = v_world_id
    AND restored_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archive audit record could not be updated';
  END IF;

  RETURN v_updated_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_archived_world_entity(
  p_archive_item_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_world_id UUID := auth.uid();
  v_deleted_id UUID;
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
      DELETE FROM public.photos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    WHEN 'video' THEN
      DELETE FROM public.videos
      WHERE id = p_entity_id AND world_id = v_world_id AND archived_at IS NOT NULL
      RETURNING id INTO v_deleted_id;
    WHEN 'track' THEN
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

REVOKE ALL ON FUNCTION public.restore_archived_world_entity(UUID, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_archived_world_entity(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_archived_world_entity(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_archived_world_entity(UUID, TEXT, UUID) TO authenticated;
