import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

declare global {
  var __peshieAbortRejectionHandlerInstalled: boolean | undefined;
}

if (!globalThis.__peshieAbortRejectionHandlerInstalled) {
  globalThis.__peshieAbortRejectionHandlerInstalled = true;
  process.on('unhandledRejection', (reason: unknown) => {
    if (
      reason instanceof Error &&
      (reason.name === 'AbortError' || reason.message?.includes('The animation was canceled'))
    ) {
      return;
    }

    throw reason;
  });
}

afterEach(() => {
  cleanup();
});
