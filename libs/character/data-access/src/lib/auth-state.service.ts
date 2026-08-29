import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import {
  AuthStatus,
  createBaselineLevel1Character,
  evaluateEmailAllowlist,
  UserProfile,
} from '@wiki/character-domain-models';
import { getApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';

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
    } catch (_err) {
      void _err;
    }

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

  setAllowlist(emails: string[]): void {
    this.allowlist.set(emails);
  }

  async loginWithGoogle(mockEmail?: string): Promise<boolean> {
    this.authStatus.set('authenticating');

    if (mockEmail) {
      return this.evaluateAndSetUser(
        `user-${mockEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        mockEmail,
        mockEmail.split('@')[0]
      );
    }

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
      } catch (err: unknown) {
        console.error('Google OAuth Popup Sign-In Error:', err);
        this.user.set(null);
        this.authStatus.set('unauthenticated');
        return false;
      }
    }

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
