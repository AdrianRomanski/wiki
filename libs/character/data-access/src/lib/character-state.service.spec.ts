import { describe, expect, it } from 'vitest';
import { CharacterStateService } from './character-state.service';
import {
  parseCharacterFromMarkdown,
  serializeCharacterToMarkdown,
} from './character-storage.adapter';

describe('CharacterStateService & Wiki Markdown Persistence', () => {
  it('loads initial character signal state', () => {
    const service = new CharacterStateService();
    const char = service.character();
    expect(char.level).toBeGreaterThanOrEqual(1);
    expect(char.attributes.intelligence).toBeGreaterThanOrEqual(10);
  });

  it('awards XP and updates signal and storage', () => {
    const service = new CharacterStateService();
    service.resetCharacter('test-hero', 'Tester');

    const updated = service.awardXp({
      amount: 200,
      statCategory: 'discipline',
      sourceDescription: 'Daily streak completion',
    });

    expect(service.character().level).toBe(2);
    expect(updated.attributes.discipline).toBe(14);
  });

  it('serializes and parses character sheet markdown accurately', () => {
    const initial = parseCharacterFromMarkdown(`---
title: "Character Sheet"
type: character
level: 5
currentXp: 150
xpToNextLevel: 1118
totalXpEarned: 1500
attributes:
  intelligence: 25
  wisdom: 18
  discipline: 20
characterTitle: "Apprentice Researcher"
---
# Character Sheet
`);

    expect(initial.level).toBe(5);
    expect(initial.currentXp).toBe(150);
    expect(initial.attributes.intelligence).toBe(25);
    expect(initial.attributes.wisdom).toBe(18);
    expect(initial.attributes.discipline).toBe(20);
    expect(initial.title).toBe('Apprentice Researcher');

    const markdown = serializeCharacterToMarkdown(initial);
    expect(markdown).toContain('level: 5');
    expect(markdown).toContain('intelligence: 25');
    expect(markdown).toContain('characterTitle: "Apprentice Researcher"');
  });
});
