import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shared world-route loading state.
 * Renders while route segments are loading — preserves navigation shell.
 */
export default function WorldLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <Skeleton className="h-4 w-72 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
