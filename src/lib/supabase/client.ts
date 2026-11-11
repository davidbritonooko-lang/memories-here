import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const testSupabaseUrl = 'http://127.0.0.1:54321';

let browserClient: SupabaseClient<Database> | null = null;
let cachedAccessToken: string | null = null;
let accessTokenExpiresAt = 0;
let accessTokenRequest: Promise<string> | null = null;

/**
 * Returns a Supabase client whose short-lived JWT is issued by the server.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (process.env.NODE_ENV === 'test' ? testSupabaseUrl : undefined);
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (process.env.NODE_ENV === 'test' ? 'test-anon-key' : undefined);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using Supabase.'
      );
    }

    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      accessToken: async () => {
        if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 30_000) {
          return cachedAccessToken;
        }

        if (!accessTokenRequest) {
          accessTokenRequest = fetch('/api/identity/session', {
            credentials: 'same-origin',
            cache: 'no-store',
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error('Your private-world session has expired.');
              }

              const { token, expiresAt } = (await response.json()) as {
                token: string;
                expiresAt: number;
              };
              cachedAccessToken = token;
              accessTokenExpiresAt = expiresAt * 1000;
              return token;
            })
            .finally(() => {
              accessTokenRequest = null;
            });
        }

        return accessTokenRequest;
      },
    });
  }

  return browserClient;
}
