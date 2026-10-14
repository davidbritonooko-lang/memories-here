import React, { Suspense } from 'react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';

/**
 * WorldShell — The persistent application shell that wraps all authenticated/world routes.
 * - Mobile: renders a bottom navigation bar (BottomNav).
 * - Desktop (≥1024px): renders a side navigation bar (SideNav).
 * The shell does NOT interrupt navigation or audio contexts.
 * Wrapped in Suspense to support Next.js 16 Partial Prerendering of client route hooks.
 */
export function WorldShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-dvh bg-[var(--bg-primary)]">
      {/* Desktop side nav — hidden on mobile, shown on lg+ */}
      <Suspense fallback={null}>
        <SideNav />
      </Suspense>

      {/* Main content area */}
      <main
        id="main-content"
        className="
          flex-1 flex flex-col min-h-dvh overflow-x-hidden
          pb-[72px] lg:pb-0
          lg:max-h-screen lg:overflow-y-auto
        "
      >
        {children}
      </main>

      {/* Mobile bottom nav — shown on mobile/tablet, hidden on lg+ */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
