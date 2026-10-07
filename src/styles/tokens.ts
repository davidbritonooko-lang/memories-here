/**
 * Design Tokens for Peshie — Her World
 * Specification Sections: 6, 7, 8
 */

export const COLOR_TOKENS = {
  light: {
    background: '#F7F5F2',
    surface: '#FFFFFF',
    elevated: '#FCFBF9',
    primaryText: '#171518',
    secondaryText: '#6F6A70',
    mutedText: '#9A949B',
    border: '#E8E3E6',
    accent: '#B96F91',
    accentSoft: '#EEDCE4',
  },
  dark: {
    background: '#0C0B0F',
    surface: '#151319',
    elevated: '#1C1920',
    primaryText: '#F5F1F4',
    secondaryText: '#AAA3AC',
    mutedText: '#77717A',
    border: '#29252C',
    accent: '#D59AB6',
    accentSoft: '#3A2934',
  },
} as const;

export const TYPOGRAPHY_ROLES = {
  primaryUI: {
    fontFamily: 'var(--font-inter)',
    description: 'Navigation, buttons, metadata, settings, labels, general interface text',
  },
  emotionalEditorial: {
    fontFamily: 'var(--font-cormorant)',
    description: 'Moment titles, important emotional statements, editorial memory presentation',
  },
  peshTok: {
    fontFamily: 'var(--font-space-grotesk)',
    description: 'Statistics, follower counts, likes, selected PeshTok elements, playful profile',
  },
} as const;

export const BREAKPOINTS = {
  mobileSmall: 360,
  mobileMedium: 375,
  mobileStandard: 390,
  mobileLarge: 412,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1440,
} as const;
