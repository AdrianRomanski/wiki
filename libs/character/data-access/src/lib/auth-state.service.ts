import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import {
  AuthStatus,
  createBaselineLevel1Character,
  evaluateEmailAllowlist,
  UserProfile,
} from '@wiki/character-domain-models';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

/**
 * Injection token for configuring permitted email addresses for Google Auth allowlist authorization.
 * Defaults to environment configuration.
 */
export const ALLOWLIST_EMAILS = new InjectionToken<string[]>('ALLOWLIST_EMAILS', {
  providedIn: 'root',
  factory: () => [],
});

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  readonly allowlist = signal<string[]>([]);
  readonly user = signal<UserProfile | null>(null);
  readonly authStatus = signal<AuthStatus>('idle');

  constructor() {
    try {
      const injectedAllowlist = inject(ALLOWLIST_EMAILS, { optional: true });
      if (injectedAllowlist && Array.isArray(injectedAllowlist)) {
        this.allowlist.set(injectedAllowlist);
      }
    } catch {
      // Fallback for unit testing environments without active Angular Injection context
    }

    // Subscribe to Firebase Auth state changes if Firebase app is initialized
    if (typeof window !== 'undefined' && getApps().length > 0) {
      try {
        const auth = getAuth(getApp());
        onAuthStateChanged(auth, (fbUser) => {
          if (fbUser && fbUser.email) {
            this.handleFirebaseUser(fbUser);
          }
        });
      } catch (err) {
        console.warn('Firebase Auth listener subscription skipped:', err);
      }
    }
  }

  /**
   * Set or update the active allowlist dynamically.
   */
  setAllowlist(emails: string[]): void {
    this.allowlist.set(emails);
  }

  /**
   * Authenticate via real Google OAuth with allowlist evaluation.
   * If mockEmail is provided, bypasses pop-up (useful for automated testing/CLI).
   */
  async loginWithGoogle(mockEmail?: string): Promise<boolean> {
    this.authStatus.set('authenticating');

    // 1. Mock parameter path (for unit tests / CLI simulation)
    if (mockEmail) {
      return this.evaluateAndSetUser(
        `user-${mockEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        mockEmail,
        mockEmail.split('@')[0]
      );
    }

    // 2. Real Firebase Google OAuth Sign-In
    if (typeof window !== 'undefined' && getApps().length > 0) {
      try {
        const auth = getAuth(getApp());
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        if (!fbUser.email) {
          throw new Error('Google account returned no email address.');
        }

        return await this.handleFirebaseUser(fbUser);
      } catch (err: any) {
        console.error('Google OAuth Popup Sign-In Error:', err);
        this.user.set(null);
        this.authStatus.set('unauthenticated');
        return false;
      }
    }

    // 3. Fallback path if Firebase App is not initialized
    const fallbackEmail = this.allowlist()[0] || 'admin@local.dev';
    return this.evaluateAndSetUser(
      `user-${fallbackEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
      fallbackEmail,
      fallbackEmail.split('@')[0]
    );
  }

  private async handleFirebaseUser(fbUser: FirebaseUser): Promise<boolean> {
    const email = fbUser.email || '';
    const isPermitted = evaluateEmailAllowlist(email, this.allowlist());

    if (!isPermitted) {
      try {
        const auth = getAuth(getApp());
        await signOut(auth);
      } catch (e) {
        console.warn('SignOut after unauthorized attempt note:', e);
      }
      this.user.set(null);
      this.authStatus.set('unauthorized');
      return false;
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: fbUser.uid,
      email: email,
      displayName: fbUser.displayName || email.split('@')[0],
      photoURL: fbUser.photoURL || undefined,
      level: 1,
      totalXp: 0,
      createdAt: now,
      lastLoginAt: now,
    };

    this.user.set(profile);
    this.authStatus.set('authenticated');
    return true;
  }

  private evaluateAndSetUser(uid: string, email: string, displayName: string): boolean {
    const isPermitted = evaluateEmailAllowlist(email, this.allowlist());

    if (!isPermitted) {
      this.user.set(null);
      this.authStatus.set('unauthorized');
      return false;
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      level: 1,
      totalXp: 0,
      createdAt: now,
      lastLoginAt: now,
    };

    this.user.set(profile);
    this.authStatus.set('authenticated');
    return true;
  }

  /**
   * Logout current authenticated user session.
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined' && getApps().length > 0) {
      try {
        const auth = getAuth(getApp());
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase logout note:', err);
      }
    }
    this.user.set(null);
    this.authStatus.set('unauthenticated');
  }

  /**
   * Generates a baseline Level 1 character for the authenticated user.
   */
  getBaselineLevel1Character() {
    const activeUser = this.user();
    if (!activeUser) {
      return createBaselineLevel1Character('default-hero', 'guest@realm.org');
    }
    return createBaselineLevel1Character(
      activeUser.uid,
      activeUser.email,
      activeUser.displayName
    );
  }
}
