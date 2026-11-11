import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  momentsRepo,
  soundtrackRepo,
  peshtokRepo,
  archiveRepo,
} from '@/lib/supabase/db';

describe('Phase 5: Database Foundation Acceptance Tests', () => {
  describe('PostgreSQL Relational Schema (Spec Sections 13, 14, 15, 48)', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    const authMigrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/003_private_world_auth.sql'
    );

    it('migration script 001_initial_schema.sql exists and is non-empty', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content.length).toBeGreaterThan(500);
    });

    it('defines all required relational entities from specification section 13', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');

      const requiredTables = [
        'worlds',
        'user_profiles',
        'locations',
        'captions',
        'caption_groups',
        'photos',
        'videos',
        'tracks',
        'playlists',
        'playlist_tracks',
        'moments',
        'moment_photos',
        'moment_videos',
        'moment_tracks',
        'peshtok_videos',
        'comments',
        'likes',
        'archive_items',
        'offline_assets',
      ];

      for (const table of requiredTables) {
        expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      }
    });

    it('enforces Row Level Security (RLS) on all tables (Spec Section 48)', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');

      const tablesWithRls = [
        'worlds',
        'moments',
        'photos',
        'videos',
        'tracks',
        'playlists',
        'peshtok_videos',
        'comments',
        'likes',
        'archive_items',
        'offline_assets',
      ];

      for (const table of tablesWithRls) {
        expect(content).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      }
    });

    it('limits database access to the authenticated owning world', () => {
      const initialSchema = fs.readFileSync(migrationPath, 'utf8');
      const authorization = fs.readFileSync(authMigrationPath, 'utf8');
      const storagePolicies = fs.readFileSync(
        path.resolve(process.cwd(), 'supabase/migrations/002_storage_buckets.sql'),
        'utf8'
      );

      expect(initialSchema).not.toContain('FOR ALL USING (true)');
      expect(storagePolicies).not.toContain('TO anon');
      expect(storagePolicies).toContain("split_part(name, '/', 1) = auth.uid()::text");
      expect(authorization).toContain('id = (SELECT auth.uid())');
      expect(authorization).toContain('world_id = (SELECT auth.uid())');
      expect(authorization).toContain('access_identity_hash');
      expect(authorization).toContain('split_part(name, \'/\', 1)');
      expect(authorization).toContain('create_next_track');
      expect(authorization).toContain('archive_world_entity');
    });

    it('defines foreign keys and indexes for relationship queries', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');

      expect(content).toContain('REFERENCES worlds(id) ON DELETE CASCADE');
      expect(content).toContain('REFERENCES moments(id) ON DELETE CASCADE');
      expect(content).toContain('REFERENCES photos(id) ON DELETE CASCADE');
      expect(content).toContain('REFERENCES videos(id) ON DELETE CASCADE');
      expect(content).toContain('REFERENCES tracks(id) ON DELETE CASCADE');
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_moments_world_id');
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_photos_world_id');
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_tracks_world_id');
    });
  });

  describe('Supabase Client Safety (Spec Section 4, 12, 48)', () => {
    it('initializes browser client safely without throwing', () => {
      const client = getSupabaseBrowserClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });

    it('does not expose service role keys to client', () => {
      const client = getSupabaseBrowserClient();
      // Verify client auth headers and options do not use service_role
      const authHeader = (client as unknown as { supabaseKey?: string }).supabaseKey;
      expect(authHeader).not.toContain('service_role');
    });
  });

  describe('Repository Operations Abstraction', () => {
    it('exposes typed repositories for all core domain systems', () => {
      expect(typeof momentsRepo.listByWorld).toBe('function');
      expect(typeof momentsRepo.getById).toBe('function');
      expect(typeof momentsRepo.create).toBe('function');
      expect(typeof momentsRepo.softDelete).toBe('function');
      expect(typeof momentsRepo.restore).toBe('function');

      expect(typeof soundtrackRepo.listTracks).toBe('function');
      expect(typeof soundtrackRepo.createNextTrack).toBe('function');

      expect(typeof peshtokRepo.listFeed).toBe('function');
      expect(typeof peshtokRepo.listComments).toBe('function');
      expect(typeof peshtokRepo.addComment).toBe('function');

      expect(typeof archiveRepo.listArchive).toBe('function');
    });
  });
});
