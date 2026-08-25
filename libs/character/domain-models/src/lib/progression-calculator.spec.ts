import { describe, expect, it } from 'vitest';
import {
  applyXpReward,
  calculateXpForLevel,
  createInitialCharacter,
  getTitleForLevel,
} from './progression-calculator';

describe('Progression Calculator', () => {
  it('creates initial character with default attributes', () => {
    const char = createInitialCharacter('hero-1', 'Adrian');
    expect(char.name).toBe('Adrian');
    expect(char.level).toBe(1);
    expect(char.currentXp).toBe(0);
    expect(char.xpToNextLevel).toBe(100);
    expect(char.attributes.intelligence).toBe(10);
    expect(char.attributes.wisdom).toBe(10);
    expect(char.attributes.discipline).toBe(10);
  });

  it('calculates XP curves correctly', () => {
    expect(calculateXpForLevel(1)).toBe(100);
    expect(calculateXpForLevel(2)).toBe(282);
    expect(calculateXpForLevel(5)).toBe(1118);
  });

  it('applies XP reward and levels up character', () => {
    const initial = createInitialCharacter();
    const updated = applyXpReward(initial, {
      amount: 150,
      statCategory: 'intelligence',
      sourceDescription: 'Completed Article Research',
    });

    expect(updated.level).toBe(2);
    expect(updated.currentXp).toBe(50);
    expect(updated.attributes.intelligence).toBe(13); // +3 INT
    expect(updated.totalXpEarned).toBe(150);
  });

  it('updates title when level threshold reached', () => {
    expect(getTitleForLevel(1)).toBe('Novice Scholar');
    expect(getTitleForLevel(5)).toBe('Apprentice Researcher');
    expect(getTitleForLevel(10)).toBe('Journeyman Engineer');
    expect(getTitleForLevel(20)).toBe('Master Craftsman');
    expect(getTitleForLevel(30)).toBe('Polymath Sage');
    expect(getTitleForLevel(50)).toBe('Grandmaster Architect');
  });
});
