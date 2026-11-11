/**
 * Product identity and approved structure.
 * Keep the production-facing product name in APP_NAME so a future rebrand
 * can update one source of truth.
 */

export const APP_NAME = 'Peshie' as const;

export const PRODUCT_IDENTITY = {
  name: APP_NAME,
  category: 'Private personal archive / installable progressive web application',
  positioning: 'A private space for moments, media, and memories.',
  statement: 'Keep photos, videos, notes, and soundtracks together in one private space.',
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
    description: 'Entry to your private space',
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
