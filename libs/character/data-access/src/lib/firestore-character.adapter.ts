import { Injectable } from '@angular/core';
import { Character, CharacterRepositoryPort, createInitialCharacter, XpTransaction } from '@wiki/character-domain-models';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  connectFirestoreEmulator,
  Firestore
} from 'firebase/firestore';
import { getAuth, signInAnonymously, connectAuthEmulator, Auth } from 'firebase/auth';

export interface FirebaseEnvironmentConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  useEmulators?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreCharacterAdapter implements CharacterRepositoryPort {
  private db?: Firestore;
  private auth?: Auth;
  private isInitialized = false;

  public initFirebase(config: FirebaseEnvironmentConfig): void {
    if (this.isInitialized) return;

    const app = !getApps().length ? initializeApp(config) : getApp();
    this.db = getFirestore(app);
    this.auth = getAuth(app);

    if (config.useEmulators) {
      try {
        connectFirestoreEmulator(this.db, 'localhost', 8080);
        connectAuthEmulator(this.auth, 'http://localhost:9099');
      } catch (err) {
        console.warn('Firebase emulators already connected or connection skipped:', err);
      }
    }

    this.isInitialized = true;
  }

  private async ensureAuth(): Promise<string> {
    if (!this.auth) {
      throw new Error('Firebase Auth is not initialized. Call initFirebase first.');
    }
    if (this.auth.currentUser) {
      return this.auth.currentUser.uid;
    }
    const credential = await signInAnonymously(this.auth);
    return credential.user.uid;
  }

  async loadCharacter(userId?: string): Promise<Character> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) throw new Error('Firestore DB not initialized');
      const docRef = doc(this.db, `users/${uid}/character`, 'sheet');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as Character;
        return {
          ...createInitialCharacter(),
          ...data,
          id: uid
        };
      }

      const initial = createInitialCharacter();
      initial.id = uid;
      await this.saveCharacter(initial, uid);
      return initial;
    } catch (err) {
      console.warn('Failed to load character from Firestore, falling back to initial character:', err);
      return createInitialCharacter();
    }
  }

  async saveCharacter(character: Character, userId?: string): Promise<void> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) throw new Error('Firestore DB not initialized');
      const docRef = doc(this.db, `users/${uid}/character`, 'sheet');
      await setDoc(docRef, {
        ...character,
        id: uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving character to Firestore:', err);
    }
  }

  async logXpTransaction(transaction: Omit<XpTransaction, 'id'>, userId?: string): Promise<void> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) throw new Error('Firestore DB not initialized');
      const txCollection = collection(this.db, `users/${uid}/xp_transactions`);
      await addDoc(txCollection, {
        ...transaction,
        userId: uid,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Error logging XP transaction to Firestore:', err);
    }
  }
}
