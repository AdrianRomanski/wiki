import { Character, createInitialCharacter } from '@wiki/character-domain-models';

export const CHARACTER_WIKI_PATH = 'wiki/character.md';

export function parseCharacterFromMarkdown(markdown: string): Character {
  try {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return createInitialCharacter();

    const yamlStr = match[1];
    const getVal = (key: string, defaultVal: number): number => {
      const m = yamlStr.match(new RegExp(`${key}:\\s*(\\d+)`));
      return m ? parseInt(m[1], 10) : defaultVal;
    };

    const level = getVal('level', 1);
    const currentXp = getVal('currentXp', 0);
    const xpToNextLevel = getVal('xpToNextLevel', 100);
    const totalXpEarned = getVal('totalXpEarned', 0);
    const intelligence = getVal('intelligence', 10);
    const wisdom = getVal('wisdom', 10);
    const discipline = getVal('discipline', 10);

    const titleMatch =
      yamlStr.match(/characterTitle:\s*"([^"]+)"/) ||
      yamlStr.match(/characterTitle:\s*([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Novice Scholar';

    return {
      id: 'wiki-character',
      name: 'Knowledge Seeker',
      level,
      currentXp,
      xpToNextLevel,
      totalXpEarned,
      attributes: {
        intelligence,
        wisdom,
        discipline,
      },
      title,
    };
  } catch {
    return createInitialCharacter();
  }
}

export function serializeCharacterToMarkdown(character: Character): string {
  return `---
title: "Character Sheet"
type: character
level: ${character.level}
currentXp: ${character.currentXp}
xpToNextLevel: ${character.xpToNextLevel}
totalXpEarned: ${character.totalXpEarned}
attributes:
  intelligence: ${character.attributes.intelligence}
  wisdom: ${character.attributes.wisdom}
  discipline: ${character.attributes.discipline}
characterTitle: "${character.title}"
---

# Character Sheet - ${character.name}

This file stores the living RPG Character Sheet state for the Life Gamification Platform.

## Character Attributes
- **Intelligence (INT)**: ${character.attributes.intelligence} (Wiki research, concept mastery)
- **Wisdom (WIS)**: ${character.attributes.wisdom} (ADR creation & architectural governance)
- **Discipline (DIS)**: ${character.attributes.discipline} (Daily quest streaks & habit consistency)
`;
}

export class CharacterStorageAdapter {
  loadCharacter(): Character {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('wiki_character_sheet_markdown');
      if (cached) {
        return parseCharacterFromMarkdown(cached);
      }
    }
    return createInitialCharacter();
  }

  saveCharacter(character: Character): void {
    const markdown = serializeCharacterToMarkdown(character);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('wiki_character_sheet_markdown', markdown);
      } catch (err) {
        console.warn('Failed to cache wiki character sheet markdown:', err);
      }
    }
  }

  clearCharacter(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('wiki_character_sheet_markdown');
    }
  }
}
