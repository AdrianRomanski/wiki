import { Character, CharacterAttributes, XpReward } from './character.model';

export const BASE_XP_PER_LEVEL = 100;
export const LEVEL_EXPONENT = 1.5;

export function calculateXpForLevel(level: number): number {
  if (level <= 1) return BASE_XP_PER_LEVEL;
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, LEVEL_EXPONENT));
}

export function createInitialCharacter(id = 'default-hero', name = 'Knowledge Seeker'): Character {
  return {
    id,
    name,
    level: 1,
    currentXp: 0,
    xpToNextLevel: calculateXpForLevel(1),
    totalXpEarned: 0,
    attributes: {
      intelligence: 10,
      wisdom: 10,
      discipline: 10,
    },
    title: 'Novice Scholar',
  };
}

export function getTitleForLevel(level: number): string {
  if (level >= 50) return 'Grandmaster Architect';
  if (level >= 30) return 'Polymath Sage';
  if (level >= 20) return 'Master Craftsman';
  if (level >= 10) return 'Journeyman Engineer';
  if (level >= 5) return 'Apprentice Researcher';
  return 'Novice Scholar';
}

export function applyXpReward(character: Character, reward: XpReward): Character {
  let { level, currentXp, totalXpEarned } = character;
  const { attributes } = character;
  const newAttributes: CharacterAttributes = { ...attributes };

  currentXp += reward.amount;
  totalXpEarned += reward.amount;

  // Stat point growth
  const statGain = Math.max(1, Math.floor(reward.amount / 50));
  newAttributes[reward.statCategory] += statGain;

  let xpNeeded = calculateXpForLevel(level);

  // Level up loop
  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    level += 1;
    xpNeeded = calculateXpForLevel(level);
  }

  return {
    ...character,
    level,
    currentXp,
    xpToNextLevel: xpNeeded,
    totalXpEarned,
    attributes: newAttributes,
    title: getTitleForLevel(level),
  };
}
