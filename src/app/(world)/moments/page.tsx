import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moments — Peshie Her World',
};

/**
 * Moments index page stub.
 * Phase 3: Shell stub. Full implementation in Phase 10–12.
 */
export default function MomentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight">
          Moments
        </h1>
        <p className="mt-1.5 text-sm text-[#6F6A70] dark:text-[#AAA3AC]">
          Composed memories, each one worth keeping.
        </p>
      </div>
    </div>
  );
}
