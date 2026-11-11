import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: noStore });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error, count } = await admin
      .from('storage_cleanup_jobs')
      .select('id, world_id, bucket_id, object_path', { count: 'exact' })
      .order('created_at', { ascending: true })
      .limit(25);

    if (error) throw error;

    const validJobs = (data ?? []).filter((job) =>
      job.object_path.startsWith(`${job.world_id}/${job.bucket_id}/`)
    );
    const byBucket = new Map<string, typeof validJobs>();

    for (const job of validJobs) {
      const bucketJobs = byBucket.get(job.bucket_id) ?? [];
      bucketJobs.push(job);
      byBucket.set(job.bucket_id, bucketJobs);
    }

    let removed = 0;
    for (const [bucket, jobs] of byBucket) {
      const { error: storageError } = await admin.storage
        .from(bucket)
        .remove(jobs.map((job) => job.object_path));

      if (storageError) continue;

      const { error: deleteError } = await admin
        .from('storage_cleanup_jobs')
        .delete()
        .in('id', jobs.map((job) => job.id));

      if (!deleteError) removed += jobs.length;
    }

    const pending = Math.max((count ?? data?.length ?? 0) - removed, 0);
    return Response.json(
      { processed: data?.length ?? 0, removed, pending },
      { headers: noStore }
    );
  } catch (error) {
    console.error('Scheduled private media cleanup failed.', error);
    return Response.json(
      { error: 'Scheduled private media cleanup failed.' },
      { status: 503, headers: noStore }
    );
  }
}
