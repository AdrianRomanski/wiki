import { Character } from './character.model';

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthorized' | 'unauthenticated';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level: 1;
  totalXp: 0;
  createdAt: string;
  lastLoginAt: string;
}

/**
 * Pure domain function validating whether an email address is authorized against an allowlist.
 * Handles whitespace trimming and case insensitivity.
 */
export function evaluateEmailAllowlist(
  email: string | null | undefined,
  allowlist: string[]
): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  return allowlist.some(
    (allowed) => allowed.trim().toLowerCase() === normalizedEmail
  );
}

/**
 * Pure domain function creating a fresh Level 1 baseline character profile for a newly authenticated user.
 */
export function createBaselineLevel1Character(
  uid: string,
  email: string,
  displayName?: string
): Character {
  const name = displayName?.trim() || email.split('@')[0] || 'Novice Scholar';

  return {
    id: uid,
    name,
    level: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    totalXpEarned: 0,
    attributes: {
      intelligence: 10,
      wisdom: 10,
      discipline: 10,
    },
    title: 'Novice Scholar',
  };
}
