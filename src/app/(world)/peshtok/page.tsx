import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PeshTok — Peshie Her World',
};

/**
 * PeshTok page stub.
 * Phase 3: Shell stub. Full PeshTok built in Phase 14–16.
 */
export default function PeshTokPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-peshtok text-3xl font-bold text-[#171518] dark:text-[#F5F1F4]">
          PeshTok
        </h1>
        <p className="mt-1.5 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
          Her little world, alive and playful.
        </p>
      </div>
    </div>
  );
}
