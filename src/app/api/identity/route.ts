import { cookies } from 'next/headers';
import {
  getWorldForAccessIdentity,
  hashAccessIdentity,
  isValidAccessIdentity,
  getSupabaseAdminClient,
  WORLD_ACCESS_COOKIE,
} from '@/lib/supabase/server';

const noStore = { 'Cache-Control': 'no-store' };
const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 60,
  path: '/',
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStore });
}

function isSameOrigin(request: Request): boolean {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessIdentity = cookieStore.get(WORLD_ACCESS_COOKIE)?.value;
    if (!isValidAccessIdentity(accessIdentity)) {
      return errorResponse('No active world session.', 401);
    }

    const world = await getWorldForAccessIdentity(accessIdentity);
    if (!world) {
      cookieStore.delete(WORLD_ACCESS_COOKIE);
      return errorResponse('No active world session.', 401);
    }

    return Response.json(
      {
        identity: {
          worldId: world.id,
          displayName: world.display_name,
          isIdentified: true,
          createdAt: world.created_at,
          lastAccessedAt: new Date().toISOString(),
        },
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error('World identity lookup failed.', error);
    return errorResponse('World identity could not be loaded.', 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse('Cross-origin requests are not allowed.', 403);
  }

  let body: { action?: unknown; accessIdentity?: unknown; displayName?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('A valid JSON request is required.', 400);
  }

  const cookieStore = await cookies();
  if (body.action === 'logout') {
    cookieStore.delete(WORLD_ACCESS_COOKIE);
    return new Response(null, { status: 204, headers: noStore });
  }

  if (!isValidAccessIdentity(body.accessIdentity)) {
    return errorResponse('The access key is invalid.', 400);
  }

  try {
    const accessIdentity = body.accessIdentity;
    let world = await getWorldForAccessIdentity(accessIdentity);

    if (body.action === 'identify') {
      if (
        typeof body.displayName !== 'string' ||
        body.displayName.trim().length === 0 ||
        body.displayName.trim().length > 80
      ) {
        return errorResponse('A name between 1 and 80 characters is required.', 400);
      }

      const { data, error } = await getSupabaseAdminClient()
        .from('worlds')
        .upsert(
          {
            access_identity_hash: hashAccessIdentity(accessIdentity),
            display_name: body.displayName.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'access_identity_hash' }
        )
        .select('id, display_name, created_at')
        .single();

      if (error) throw error;
      world = data;
    } else if (body.action !== 'restore') {
      return errorResponse('The requested identity action is invalid.', 400);
    }

    if (!world) {
      return errorResponse('That access key was not recognized.', 401);
    }

    cookieStore.set(WORLD_ACCESS_COOKIE, accessIdentity, cookieOptions);
    return Response.json(
      {
        identity: {
          worldId: world.id,
          displayName: world.display_name,
          isIdentified: true,
          createdAt: world.created_at,
          lastAccessedAt: new Date().toISOString(),
        },
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error('World identity update failed.', error);
    return errorResponse('World identity could not be saved.', 503);
  }
}
