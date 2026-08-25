import { Injectable, signal } from '@angular/core';
import {
  applyXpReward,
  Character,
  createInitialCharacter,
  XpReward,
} from '@wiki/character-domain-models';
import { CharacterStorageAdapter } from './character-storage.adapter';

@Injectable({
  providedIn: 'root',
})
export class CharacterStateService {
  private readonly storageAdapter = new CharacterStorageAdapter();

  readonly character = signal<Character>(this.storageAdapter.loadCharacter());

  awardXp(reward: XpReward): Character {
    const current = this.character();
    const updated = applyXpReward(current, reward);
    this.character.set(updated);
    this.storageAdapter.saveCharacter(updated);
    return updated;
  }

  resetCharacter(id?: string, name?: string): Character {
    const fresh = createInitialCharacter(id, name);
    this.character.set(fresh);
    this.storageAdapter.saveCharacter(fresh);
    return fresh;
  }
}
