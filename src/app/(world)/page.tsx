import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home — Peshie Her World',
};

/**
 * Home page — the timeless entry to her world.
 * Phase 3: Shell stub. Full experience built in Phase 21.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight leading-tight">
        Her World
      </h1>
      <p className="mt-4 text-base text-[#6F6A70] dark:text-[#AAA3AC] max-w-xs leading-relaxed">
        A little corner of the internet that belongs to her.
      </p>
    </div>
  );
}
