import { Injectable } from '@angular/core';
import { 
  Character, 
  CharacterRepositoryPort, 
  Course,
  createInitialCharacter, 
  XpEventLog, 
  XpEventRepositoryPort, 
  XpTransaction 
} from '@wiki/character-domain-models';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query,
  where,
  orderBy,
  getDocs,
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
export class FirestoreCharacterAdapter implements CharacterRepositoryPort, XpEventRepositoryPort {
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

  async logXpEvent(event: Omit<XpEventLog, 'id'>, userId?: string): Promise<XpEventLog> {
    const uid = userId || await this.ensureAuth();
    if (!this.db) throw new Error('Firestore DB not initialized');

    const xpEventsCol = collection(this.db, `users/${uid}/xp_events`);
    const docRef = await addDoc(xpEventsCol, {
      ...event,
      userId: uid,
    });

    return {
      ...event,
      id: docRef.id,
      userId: uid,
    };
  }

  async getXpEventsByDateRange(startDate: string, endDate: string, userId?: string): Promise<XpEventLog[]> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) return [];
      const xpEventsCol = collection(this.db, `users/${uid}/xp_events`);
      const q = query(
        xpEventsCol,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        orderBy('timestamp', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<XpEventLog, 'id'>),
      }));
    } catch (err) {
      console.warn('Failed to query xp_events by date range from Firestore:', err);
      return [];
    }
  }

  async getXpEvents(userId?: string): Promise<XpEventLog[]> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) return [];
      const xpEventsCol = collection(this.db, `users/${uid}/xp_events`);
      const q = query(xpEventsCol, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<XpEventLog, 'id'>),
      }));
    } catch (err) {
      console.warn('Failed to query xp_events from Firestore:', err);
      return [];
    }
  }

  async loadCourses(userId?: string): Promise<Course[]> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) return [];
      const coursesCol = collection(this.db, `users/${uid}/courses`);
      const snap = await getDocs(coursesCol);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Course, 'id'>),
      }));
    } catch (err) {
      console.warn('Failed to load courses from Firestore:', err);
      return [];
    }
  }

  async saveCourse(course: Course, userId?: string): Promise<void> {
    try {
      const uid = userId || await this.ensureAuth();
      if (!this.db) throw new Error('Firestore DB not initialized');
      const docRef = doc(this.db, `users/${uid}/courses`, course.id);
      await setDoc(docRef, {
        ...course,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Error saving course to Firestore:', err);
    }
  }
}

