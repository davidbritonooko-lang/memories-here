import { cookies } from 'next/headers';
import {
  createWorldAccessToken,
  getWorldForAccessIdentity,
  isValidAccessIdentity,
  WORLD_ACCESS_COOKIE,
} from '@/lib/supabase/server';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessIdentity = cookieStore.get(WORLD_ACCESS_COOKIE)?.value;
    if (!isValidAccessIdentity(accessIdentity)) {
      return Response.json({ error: 'No active world session.' }, { status: 401, headers: noStore });
    }

    const world = await getWorldForAccessIdentity(accessIdentity);
    if (!world) {
      cookieStore.delete(WORLD_ACCESS_COOKIE);
      return Response.json({ error: 'No active world session.' }, { status: 401, headers: noStore });
    }

    const session = createWorldAccessToken(world.id);
    return Response.json(session, { headers: noStore });
  } catch (error) {
    console.error('World session token issuance failed.', error);
    return Response.json(
      { error: 'A private-world session could not be created.' },
      { status: 503, headers: noStore }
    );
  }
}
