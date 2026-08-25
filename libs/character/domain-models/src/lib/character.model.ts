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
