/**
 * World Identity & Private Access Management
 * Specification Sections: 2, 11, 12, 14
 */

export interface WorldIdentity {
  worldId: string;
  displayName: string;
  accessIdentity: string;
  isIdentified: boolean;
  createdAt: string;
  lastAccessedAt: string;
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'peshie_access_token',
  WORLD_IDENTITY: 'peshie_world_identity',
} as const;

/**
 * Generates a high-entropy, cryptographically unguessable access identifier.
 * Format: 32-byte hex string (256 bits of entropy).
 */
export function generateAccessIdentity(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-crypto environments (tests)
  return 'peshie_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Extracts private access token from URL query string if present (?access=... or ?key=...).
 */
export function extractAccessIdentityFromUrl(
  search: string | URLSearchParams
): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  return params.get('access') || params.get('key') || null;
}

/**
 * Retrieves stored access token from localStorage.
 */
export function getStoredAccessIdentity(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Persists access token in localStorage.
 */
export function setStoredAccessIdentity(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Retrieves cached world identity.
 */
export function getStoredWorldIdentity(): WorldIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORLD_IDENTITY);
    if (!raw) return null;
    return JSON.parse(raw) as WorldIdentity;
  } catch {
    return null;
  }
}

/**
 * Persists world identity in localStorage.
 */
export function setStoredWorldIdentity(identity: WorldIdentity): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.WORLD_IDENTITY, JSON.stringify(identity));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears world identity and access token (logout / reset).
 */
export function clearStoredWorldIdentity(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.WORLD_IDENTITY);
  } catch {
    // Ignore
  }
}
