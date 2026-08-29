import { effect, inject, Injectable, signal } from '@angular/core';
import {
  applyXpReward,
  Character,
  createBaselineLevel1Character,
  createInitialCharacter,
  statCategoryToStatType,
  XpEventLog,
  XpReward,
  XpSourceType,
} from '@wiki/character-domain-models';
import { AuthStateService } from './auth-state.service';
import { CharacterStorageAdapter } from './character-storage.adapter';
import { FirestoreCharacterAdapter } from './firestore-character.adapter';
import { XpEventStorageAdapter } from './xp-event-storage.adapter';

@Injectable({
  providedIn: 'root',
})
export class CharacterStateService {
  private readonly storageAdapter = new CharacterStorageAdapter();
  private readonly xpEventStorageAdapter = new XpEventStorageAdapter();
  private readonly firestoreAdapter?: FirestoreCharacterAdapter;
  private readonly authStateService?: AuthStateService;

  readonly character = signal<Character>(this.storageAdapter.loadCharacter());
  readonly xpEvents = signal<XpEventLog[]>(this.xpEventStorageAdapter.loadXpEvents());

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

      this.firestoreAdapter
        .getXpEvents()
        .then((cloudEvents) => {
          if (cloudEvents && cloudEvents.length > 0) {
            this.xpEvents.set(cloudEvents);
          }
        })
        .catch((err) => {
          console.warn('Firestore XP events load note:', err);
        });
    }

    if (this.authStateService) {
      effect(() => {
        const user = this.authStateService?.user();
        if (user) {
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

  awardXp(reward: XpReward, sourceType: XpSourceType = 'CUSTOM_ACTION', sourceId?: string): Character {
    const current = this.character();
    const updated = applyXpReward(current, reward);
    this.character.set(updated);

    this.storageAdapter.saveCharacter(updated);

    const now = new Date();
    const eventData: Omit<XpEventLog, 'id'> = {
      userId: updated.id,
      xpAwarded: reward.amount,
      statType: statCategoryToStatType(reward.statCategory),
      sourceType,
      sourceId,
      description: reward.sourceDescription,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
    };

    const savedLocal = this.xpEventStorageAdapter.saveXpEvent(eventData);
    this.xpEvents.update((events) => [savedLocal, ...events]);

    if (this.firestoreAdapter) {
      this.firestoreAdapter.saveCharacter(updated);
      this.firestoreAdapter.logXpTransaction({
        amount: reward.amount,
        statCategory: reward.statCategory,
        sourceDescription: reward.sourceDescription,
        userId: updated.id,
        timestamp: now.toISOString(),
      });
      this.firestoreAdapter.logXpEvent(eventData).catch((err) => {
        console.error('Failed to log XP event to Firestore:', err);
      });
    }

    return updated;
  }

  async loadXpEventsForDateRange(startDate: string, endDate: string): Promise<XpEventLog[]> {
    if (this.firestoreAdapter) {
      const cloudEvents = await this.firestoreAdapter.getXpEventsByDateRange(startDate, endDate);
      if (cloudEvents && cloudEvents.length > 0) {
        return cloudEvents;
      }
    }
    return this.xpEventStorageAdapter.getXpEventsByDateRange(startDate, endDate);
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

