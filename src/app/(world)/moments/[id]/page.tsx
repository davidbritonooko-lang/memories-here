import React from 'react';

/**
 * Moment detail page stub — dynamic route.
 * Phase 3: Shell stub. Full Moment Engine built in Phase 10–12.
 * Params are a Promise per Next.js 16 App Router spec.
 */
export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <p className="font-ui text-xs text-[#9A949B] dark:text-[#77717A] tracking-widest uppercase mb-2">
        Moment
      </p>
      <h1 className="font-editorial text-3xl font-semibold text-[#171518] dark:text-[#F5F1F4]">
        {id}
      </h1>
    </div>
  );
}
