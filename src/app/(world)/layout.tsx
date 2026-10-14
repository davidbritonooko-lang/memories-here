import React from 'react';
import { WorldShell } from '@/components/shell/WorldShell';

/**
 * World Route Group Layout
 * Wraps all primary world routes with the WorldShell (navigation, structure).
 * Route group (world) means this layout applies to all routes inside the folder
 * without adding a URL segment.
 */
export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorldShell>{children}</WorldShell>;
}
