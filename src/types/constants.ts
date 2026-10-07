/**
 * Peshie — Her World
 * Foundational Product Constants & Approved Structure
 * Specification Sections: 1, 3, 7, 8
 */

export const PRODUCT_IDENTITY = {
  name: 'Peshie — Her World',
  category: 'Private personal memory world / installable progressive web application',
  positioning: 'A little corner of the internet that belongs to her.',
  statement: 'I noticed these things about your life, and I thought they were worth keeping.',
} as const;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  description: string;
}

export const APPROVED_NAVIGATION: readonly NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    description: 'Timeless entry to her world',
  },
  {
    id: 'moments',
    label: 'Moments',
    href: '/moments',
    description: 'Cinematic composed memories',
  },
  {
    id: 'peshtok',
    label: 'PeshTok',
    href: '/peshtok',
    description: 'Alive and playful fictional social layer',
  },
  {
    id: 'soundtrack',
    label: 'Soundtrack',
    href: '/soundtrack',
    description: 'Atmospheric music library',
  },
  {
    id: 'archive',
    label: 'Archive',
    href: '/archive',
    description: 'Quiet museum-like preserved memories',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    description: 'Preferences, theme, installation, and offline cache',
  },
] as const;
