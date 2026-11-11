import React from 'react';
import { WorldShell } from '@/components/shell/WorldShell';
import { PlayfulIdentityGate } from '@/features/identity';

/**
 * World Route Group Layout
 * Wraps all primary world routes with the WorldShell and PlayfulIdentityGate.
 * If no valid session exists, presents neutral onboarding for the private archive.
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
