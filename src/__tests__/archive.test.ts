import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc: rpcMock }),
}));

import { archiveRepo } from '@/lib/supabase/db';

describe('Phase 13: Archive Repository', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: 'entity-1', error: null });
  });

  it('restores the entity and its archive audit record through one atomic operation', async () => {
    await archiveRepo.restoreItem('archive-1', 'moment', 'entity-1');

    expect(rpcMock).toHaveBeenCalledWith('restore_archived_world_entity', {
      p_archive_item_id: 'archive-1',
      p_entity_id: 'entity-1',
      p_entity_type: 'moment',
    });
  });

  it('does not report restore success when the atomic database operation fails', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: new Error('database unavailable'),
    });

    await expect(
      archiveRepo.restoreItem('archive-1', 'moment', 'entity-1')
    ).rejects.toThrow('database unavailable');
  });

  it('purges an archived entity and its audit record through one atomic operation', async () => {
    await archiveRepo.permanentlyDelete('archive-1', 'photo', 'entity-1');

    expect(rpcMock).toHaveBeenCalledWith('purge_archived_world_entity', {
      p_archive_item_id: 'archive-1',
      p_entity_id: 'entity-1',
      p_entity_type: 'photo',
    });
  });

  it('rejects unsupported entity types before calling the database', async () => {
    await expect(
      archiveRepo.restoreItem('archive-1', 'unsupported', 'entity-1')
    ).rejects.toThrow('Unsupported archive entity type.');
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
