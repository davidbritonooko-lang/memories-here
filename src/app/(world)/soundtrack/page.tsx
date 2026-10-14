import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soundtrack — Peshie Her World',
};

/**
 * Soundtrack page stub.
 * Phase 3: Shell stub. Full Soundtrack & Music Engine in Phase 8–9.
 */
export default function SoundtrackPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight">
          Soundtrack
        </h1>
        <p className="mt-1.5 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
          Atmospheric music that lives inside her world.
        </p>
      </div>
    </div>
  );
}
