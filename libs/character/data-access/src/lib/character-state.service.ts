import { inject, Injectable, signal } from '@angular/core';
import {
  applyXpReward,
  Character,
  createInitialCharacter,
  XpReward,
} from '@wiki/character-domain-models';
import { CharacterStorageAdapter } from './character-storage.adapter';
import { FirestoreCharacterAdapter } from './firestore-character.adapter';

@Injectable({
  providedIn: 'root',
})
export class CharacterStateService {
  private readonly storageAdapter = new CharacterStorageAdapter();
  private readonly firestoreAdapter?: FirestoreCharacterAdapter;

  readonly character = signal<Character>(this.storageAdapter.loadCharacter());

  constructor() {
    try {
      this.firestoreAdapter = inject(FirestoreCharacterAdapter, { optional: true }) || undefined;
    } catch {
      this.firestoreAdapter = undefined;
    }

    if (this.firestoreAdapter) {
      this.firestoreAdapter.loadCharacter().then((cloudCharacter) => {
        if (cloudCharacter && cloudCharacter.totalXpEarned > 0) {
          this.character.set(cloudCharacter);
          this.storageAdapter.saveCharacter(cloudCharacter);
        }
      }).catch((err) => {
        console.warn('Firestore sync optional load note:', err);
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


