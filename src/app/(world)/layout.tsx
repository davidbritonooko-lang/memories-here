import React from 'react';
import { WorldShell } from '@/components/shell/WorldShell';
import { PlayfulIdentityGate } from '@/features/identity';

/**
 * World Route Group Layout
 * Wraps all primary world routes with the WorldShell and PlayfulIdentityGate.
 * If she hasn't identified herself yet, presents the playful memory onboarding:
 * "who's the pretty girl around here?" -> "I'll remember you forever."
 * Once identified, reveals Her World.
 */
export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayfulIdentityGate>
      <WorldShell>{children}</WorldShell>
    </PlayfulIdentityGate>
  );
}
