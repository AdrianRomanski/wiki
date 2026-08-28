import { effect, inject, Injectable, signal } from '@angular/core';
import {
  applyXpReward,
  Character,
  createBaselineLevel1Character,
  createInitialCharacter,
  XpReward,
} from '@wiki/character-domain-models';
import { AuthStateService } from './auth-state.service';
import { CharacterStorageAdapter } from './character-storage.adapter';
import { FirestoreCharacterAdapter } from './firestore-character.adapter';

@Injectable({
  providedIn: 'root',
})
export class CharacterStateService {
  private readonly storageAdapter = new CharacterStorageAdapter();
  private readonly firestoreAdapter?: FirestoreCharacterAdapter;
  private readonly authStateService?: AuthStateService;

  readonly character = signal<Character>(this.storageAdapter.loadCharacter());

  constructor() {
    try {
      this.firestoreAdapter = inject(FirestoreCharacterAdapter, { optional: true }) || undefined;
    } catch {
      this.firestoreAdapter = undefined;
    }

    try {
      this.authStateService = inject(AuthStateService, { optional: true }) || undefined;
    } catch {
      this.authStateService = undefined;
    }

    if (this.firestoreAdapter) {
      this.firestoreAdapter
        .loadCharacter()
        .then((cloudCharacter) => {
          if (cloudCharacter && cloudCharacter.totalXpEarned > 0) {
            this.character.set(cloudCharacter);
            this.storageAdapter.saveCharacter(cloudCharacter);
          }
        })
        .catch((err) => {
          console.warn('Firestore sync optional load note:', err);
        });
    }

    // Reaction to Auth State changes (ADR-0008)
    if (this.authStateService) {
      effect(() => {
        const user = this.authStateService?.user();
        if (user) {
          // Initialize or load Level 1 baseline for authenticated allowlisted user
          const loaded = this.storageAdapter.loadCharacter();
          if (!loaded || loaded.id !== user.uid) {
            const baseline = createBaselineLevel1Character(user.uid, user.email, user.displayName);
            this.character.set(baseline);
            this.storageAdapter.saveCharacter(baseline);
          }
        }
      });
    }
  }

  awardXp(reward: XpReward): Character {
    const current = this.character();
    const updated = applyXpReward(current, reward);
    this.character.set(updated);

    this.storageAdapter.saveCharacter(updated);
    if (this.firestoreAdapter) {
      this.firestoreAdapter.saveCharacter(updated);
      this.firestoreAdapter.logXpTransaction({
        amount: reward.amount,
        statCategory: reward.statCategory,
        sourceDescription: reward.sourceDescription,
        userId: updated.id,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  resetCharacter(id?: string, name?: string): Character {
    const fresh = createInitialCharacter(id, name);
    this.character.set(fresh);
    this.storageAdapter.saveCharacter(fresh);
    if (this.firestoreAdapter) {
      this.firestoreAdapter.saveCharacter(fresh);
    }
    return fresh;
  }
}
