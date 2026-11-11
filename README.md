# Peshie

A private personal archive for moments, media, notes, and soundtracks. The app is built
with Next.js 16, React, TypeScript, and Supabase.

## Project status and phases

The source and acceptance-test labels show foundational work through Phase 10.
Phase 10 currently provides the Moments list and creation baseline; its detail
route is still a stub. This maintenance pass fixes the correctness and access
control issues found before starting the next feature phase.

| Phase | Scope | Status in this checkout |
|---|---|---|
| 1–3 | Project foundation, design system, and application shell | Baseline implemented |
| 4–9 | Identity, database, storage, media, music engine, and soundtrack library | Baseline implemented; identity and authorization hardened in this pass |
| 10 | Moments list and creation | Initial implementation; detail route remains a stub |
| **11–12** | **Moment Engine and moment detail experience** | **Next phase; not started** |
| 13 | Archive | Transactional restore/purge with a durable private Storage cleanup queue |
| 14–16 | PeshTok | Stub |
| 20 | Settings | Stub |
| 21 | Home experience | Stub |

Phase 11–12 is the next implementation milestone. The sequence above is
compiled from phase references in source and tests; a separate phase
specification is not present in this repository. Confirm the Phase 11–12
acceptance criteria before building the feature.

## Run locally

1. Install Node.js and npm.
2. Configure the Supabase environment variables below.
3. Apply the SQL migrations in `supabase/migrations/` in numeric order to the
   target Supabase project.
4. Install dependencies and start the development server:

   ```bash
   npm ci
   npm run dev
   ```

5. Open <http://localhost:3000>.

The existing project must have all five migrations applied. In particular,
`003_private_world_auth.sql` hashes existing world access keys, removes the raw
key column, and replaces the earlier open policies. Do not deploy the app with
only migrations 001–004 applied.

## Environment

Set these variables in an ignored local `.env.local` file and in the deployment
environment:

| Variable | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the browser SDK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used to create/restore a world |
| `SUPABASE_JWT_SECRET` | Server-only Supabase JWT signing secret used for short-lived world-scoped sessions |
| `SUPABASE_URL` | Optional server-side project URL; falls back to `NEXT_PUBLIC_SUPABASE_URL` |
| `CRON_SECRET` | Required to authenticate the scheduled Vercel Storage cleanup job |

Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_JWT_SECRET` with
`NEXT_PUBLIC_`, commit them, or send them to the browser. The service-role key
bypasses row-level security. The JWT secret must be the signing secret accepted
by the target Supabase project for HS256 access tokens.

World recovery keys are generated with 256 bits of cryptographic randomness.
The server stores only their SHA-256 hashes and sets a `Secure`/`HttpOnly`
session cookie in production. The recovery key is kept in local browser storage
to support restoration on that device; treat it as a password. A copied
`?access=<key>` or `?key=<key>` link can restore the world on another device;
the query parameter is removed from the address bar after it is read.

## Validation

```bash
npm run type-check
npm run lint
npm test
npm run build
```

Tests use a local-only Supabase URL fallback and should not require a live
project. Do not use production credentials to run tests.

## Changes in this maintenance pass

- Replaced unrestricted anonymous database and Storage access with
  authenticated policies scoped to the owning world UUID. Related media,
  playlists, moments, comments, and storage paths are checked against the
  same world.
- Added server-side world creation/restoration, hashed recovery keys,
  HttpOnly session cookies, and short-lived JWTs. Browser Supabase access uses
  those JWTs; world UUIDs now come from the database instead of being
  synthesized from a key or display name.
- Corrected Moments tab props to match the shared Tabs component and the
  TypeScript type-checker.
- Made soundtrack queue advancement resolve and play the next track, and
  surfaced URL resolution failures instead of attempting a broken path.
- Added cleanup for uploaded media when URL creation or database registration
  fails. Upload success now requires a valid signed URL.
- Replaced race-prone client track numbering with an atomic database function
  and stopped querying track numbers before validating uploads.
- Added world-scoped transactional archive restore and purge operations. Purges enqueue private Storage objects for deletion; the authenticated cleanup endpoint processes them on archive visits, and a daily Vercel Cron retries pending jobs. The queue is protected by RLS and the purge function runs with invoker privileges.
- Added opt-in, world-scoped local caching for photos, videos, and soundtrack media. A service worker serves cached media after a network failure; app pages themselves still require connectivity. Offline media caches are cleared on logout, when the active world changes, and after permanent archive deletion. Cached media is stored in browser Cache Storage and is not separately encrypted.
- Replaced relationship-oriented onboarding with neutral private-space setup and updated home greetings.
- Removed silent empty-library fallbacks so soundtrack load failures are reported to the user.
- Added server configuration and setup guidance, clarified the phase roadmap,
  and expanded tests for authenticated access, sequential playback, archive transactions, and cache isolation.
