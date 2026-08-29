import { describe, expect, it } from 'vitest';
import { statCategoryToStatType, statTypeToStatCategory } from './xp-event.model';

describe('XpEvent Model & Stat Mappers', () => {
  it('should correctly map StatCategory to StatType', () => {
    expect(statCategoryToStatType('intelligence')).toBe('INT');
    expect(statCategoryToStatType('wisdom')).toBe('WIS');
    expect(statCategoryToStatType('discipline')).toBe('DIS');
  });

  it('should correctly map StatType to StatCategory', () => {
    expect(statTypeToStatCategory('INT')).toBe('intelligence');
    expect(statTypeToStatCategory('WIS')).toBe('wisdom');
    expect(statTypeToStatCategory('DIS')).toBe('discipline');
    expect(statTypeToStatCategory('STR')).toBe('discipline');
    expect(statTypeToStatCategory('VIT')).toBe('discipline');
  });
});
