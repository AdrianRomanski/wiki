export interface CharacterAttributes {
  intelligence: number;
  wisdom: number;
  discipline: number;
}

export interface Character {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  attributes: CharacterAttributes;
  title: string;
}

export type StatCategory = 'intelligence' | 'wisdom' | 'discipline';

export interface XpReward {
  amount: number;
  statCategory: StatCategory;
  sourceDescription: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  statCategory: StatCategory;
  sourceDescription: string;
  timestamp: string;
}

export interface CharacterRepositoryPort {
  loadCharacter(userId?: string): Promise<Character>;
  saveCharacter(character: Character, userId?: string): Promise<void>;
  logXpTransaction?(transaction: Omit<XpTransaction, 'id'>, userId?: string): Promise<void>;
}

