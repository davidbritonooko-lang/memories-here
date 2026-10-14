import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Peshie Her World',
};

/**
 * Settings page stub.
 * Phase 3: Shell stub. Full Settings built in Phase 20.
 * Includes: Theme, Installation, Offline Storage, Music.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-ui text-2xl font-semibold text-[#171518] dark:text-[#F5F1F4]">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
          Preferences for her world.
        </p>
      </div>
    </div>
  );
}
