import { XpEventLog } from '@wiki/character-domain-models';

const LOCAL_STORAGE_KEY = 'lifeforge_xp_events';

export class XpEventStorageAdapter {
  private inMemoryEvents: XpEventLog[] = [];

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  loadXpEvents(): XpEventLog[] {
    if (this.isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as XpEventLog[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse XP events from localStorage:', err);
      }
    }
    return this.inMemoryEvents;
  }

  saveXpEvent(event: Omit<XpEventLog, 'id'>): XpEventLog {
    const fullLog: XpEventLog = {
      ...event,
      id: `xp-event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    const current = this.loadXpEvents();
    this.inMemoryEvents = [fullLog, ...current];

    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.inMemoryEvents));
      } catch (err) {
        console.error('Failed to save XP event to localStorage:', err);
      }
    }

    return fullLog;
  }

  clear(): void {
    this.inMemoryEvents = [];
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (err) {
        console.warn('Failed to clear localStorage XP events:', err);
      }
    }
  }

  getXpEventsByDateRange(startDate: string, endDate: string): XpEventLog[] {
    const events = this.loadXpEvents();
    return events.filter((e) => e.date >= startDate && e.date <= endDate);
  }
}
