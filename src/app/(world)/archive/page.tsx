import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archive — Peshie Her World',
};

/**
 * Archive page stub.
 * Phase 3: Shell stub. Full Archive built in Phase 13.
 */
export default function ArchivePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight">
          Archive
        </h1>
        <p className="mt-1.5 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
          Quiet. Museum-like. Every memory preserved.
        </p>
      </div>
    </div>
  );
}
