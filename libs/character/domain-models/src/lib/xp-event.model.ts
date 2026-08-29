import { StatCategory } from './character.model';

export type StatType = 'STR' | 'INT' | 'WIS' | 'DIS' | 'VIT';

export type XpSourceType =
  | 'EARLY_WAKE_UP_QUEST'
  | 'BOOK_READING_QUEST'
  | 'HABIT_COMPLETION'
  | 'KNOWLEDGE_WIKI_STREAK'
  | 'CUSTOM_ACTION';

export interface XpEventLog {
  id: string;
  userId: string;
  xpAwarded: number;
  statType: StatType;
  sourceType: XpSourceType;
  sourceId?: string;
  description: string;
  date: string;       // Format: "YYYY-MM-DD"
  timestamp: string;  // Format: ISO 8601 timestamp
}

export interface XpEventRepositoryPort {
  logXpEvent(event: Omit<XpEventLog, 'id'>, userId?: string): Promise<XpEventLog>;
  getXpEventsByDateRange(startDate: string, endDate: string, userId?: string): Promise<XpEventLog[]>;
  getXpEvents(userId?: string): Promise<XpEventLog[]>;
}

export function statCategoryToStatType(category: StatCategory): StatType {
  switch (category) {
    case 'intelligence':
      return 'INT';
    case 'wisdom':
      return 'WIS';
    case 'discipline':
      return 'DIS';
    default:
      return 'INT';
  }
}

export function statTypeToStatCategory(stat: StatType): StatCategory {
  switch (stat) {
    case 'INT':
      return 'intelligence';
    case 'WIS':
      return 'wisdom';
    case 'DIS':
      return 'discipline';
    case 'STR':
    case 'VIT':
    default:
      return 'discipline';
  }
}
