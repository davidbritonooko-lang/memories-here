import 'server-only';

import { createHash, createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const WORLD_ACCESS_COOKIE = 'peshie_access_token';

export interface WorldSession {
  id: string;
  display_name: string;
  created_at: string;
}

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}

export function hashAccessIdentity(accessIdentity: string): string {
  return createHash('sha256').update(accessIdentity, 'utf8').digest('hex');
}

export async function getWorldForAccessIdentity(
  accessIdentity: string
): Promise<WorldSession | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from('worlds')
    .select('id, display_name, created_at')
    .eq('access_identity_hash', hashAccessIdentity(accessIdentity))
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function createWorldAccessToken(worldId: string): {
  token: string;
  expiresAt: number;
} {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('The Supabase JWT secret is not configured.');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 10 * 60;
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsignedToken = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      aud: 'authenticated',
      exp: expiresAt,
      iat: issuedAt,
      iss: 'supabase',
      role: 'authenticated',
      sub: worldId,
    }),
  ].join('.');
  const signature = createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');

  return { token: `${unsignedToken}.${signature}`, expiresAt };
}

export function isValidAccessIdentity(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);
}
