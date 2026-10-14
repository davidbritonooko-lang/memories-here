import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Not Found — Peshie Her World',
};

/**
 * Global 404 — displayed when a route does not exist.
 * Preserves product tone. Does not show technical stack info.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center bg-[#F7F5F2] dark:bg-[#0C0B0F]">
      <p className="font-ui text-xs text-[#9A949B] dark:text-[#77717A] tracking-widest uppercase mb-4">
        404
      </p>
      <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#171518] dark:text-[#F5F1F4] tracking-tight">
        This part of the world
        <br />doesn&apos;t exist yet.
      </h1>
      <p className="mt-4 text-sm text-[#6F6A70] dark:text-[#AAA3AC] max-w-xs">
        The memory you&apos;re looking for may have moved, or maybe it was never here.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Go back home</Button>
        </Link>
      </div>
    </div>
  );
}
