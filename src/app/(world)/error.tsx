'use client';

import React from 'react';
import { ErrorState } from '@/components/ui/error-state';

/**
 * World-route error boundary.
 * Displays a calm, product-toned error with retry capability.
 * Navigation shell is preserved on error.
 */
export default function WorldError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log in development only
  if (process.env.NODE_ENV === 'development') {
    console.error('[WorldError]', error);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <ErrorState
        title="Something got in the way."
        message="This part of the world isn't loading right now. Try again."
        onRetry={reset}
        className="w-full max-w-md"
      />
    </div>
  );
}
