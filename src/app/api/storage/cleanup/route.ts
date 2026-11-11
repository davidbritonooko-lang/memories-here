import { cookies } from 'next/headers';
import {
  getSupabaseAdminClient,
  getWorldForAccessIdentity,
  isValidAccessIdentity,
  WORLD_ACCESS_COOKIE,
} from '@/lib/supabase/server';

const noStore = { 'Cache-Control': 'no-store' };

function isSameOrigin(request: Request): boolean {
  return request.headers.get('origin') === new URL(request.url).origin;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStore });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse('Cross-origin requests are not allowed.', 403);
  }

  try {
    const cookieStore = await cookies();
    const accessIdentity = cookieStore.get(WORLD_ACCESS_COOKIE)?.value;
    if (!isValidAccessIdentity(accessIdentity)) {
      return errorResponse('An active private-space session is required.', 401);
    }

    const world = await getWorldForAccessIdentity(accessIdentity);
    if (!world) {
      cookieStore.delete(WORLD_ACCESS_COOKIE);
      return errorResponse('The private-space session is no longer valid.', 401);
    }

    const admin = getSupabaseAdminClient();
    const { data, error, count } = await admin
      .from('storage_cleanup_jobs')
      .select('id, bucket_id, object_path', { count: 'exact' })
      .eq('world_id', world.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    let removed = 0;
    for (const job of data ?? []) {
      const expectedPrefix = `${world.id}/${job.bucket_id}/`;
      if (!job.object_path.startsWith(expectedPrefix)) continue;

      const { error: storageError } = await admin.storage
        .from(job.bucket_id)
        .remove([job.object_path]);

      if (storageError) continue;

      const { error: jobError } = await admin
        .from('storage_cleanup_jobs')
        .delete()
        .eq('id', job.id)
        .eq('world_id', world.id);

      if (!jobError) removed += 1;
    }

    const pending = Math.max((count ?? data?.length ?? 0) - removed, 0);
    return Response.json(
      { processed: data?.length ?? 0, removed, pending },
      { headers: noStore }
    );
  } catch (error) {
    console.error('Private media cleanup failed.', error);
    return errorResponse('Private media cleanup is temporarily unavailable.', 503);
  }
}
