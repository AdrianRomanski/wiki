import { beforeEach, describe, expect, it } from 'vitest';
import { CharacterStateService } from './character-state.service';
import { XpEventStorageAdapter } from './xp-event-storage.adapter';

describe('XP Event Data Access & State Service (ADR-0009)', () => {
  let storageAdapter: XpEventStorageAdapter;
  let stateService: CharacterStateService;

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    storageAdapter = new XpEventStorageAdapter();
    stateService = new CharacterStateService();
  });

  it('should store and load XP events via XpEventStorageAdapter', () => {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const saved = storageAdapter.saveXpEvent({
      userId: 'test-user-1',
      xpAwarded: 50,
      statType: 'DIS',
      sourceType: 'EARLY_WAKE_UP_QUEST',
      description: 'Woke up early at 06:00 AM',
      date: today,
      timestamp,
    });

    expect(saved.id).toBeDefined();
    expect(saved.xpAwarded).toBe(50);
    expect(saved.statType).toBe('DIS');

    const loaded = storageAdapter.loadXpEvents();
    expect(loaded.length).toBeGreaterThanOrEqual(1);
    expect(loaded[0].id).toBe(saved.id);
  });

  it('should filter XP events by date range in XpEventStorageAdapter', () => {
    storageAdapter.saveXpEvent({
      userId: 'test-user-1',
      xpAwarded: 100,
      statType: 'WIS',
      sourceType: 'BOOK_READING_QUEST',
      description: 'Reading session',
      date: '2026-08-20',
      timestamp: '2026-08-20T10:00:00Z',
    });

    storageAdapter.saveXpEvent({
      userId: 'test-user-1',
      xpAwarded: 60,
      statType: 'DIS',
      sourceType: 'EARLY_WAKE_UP_QUEST',
      description: 'Morning wakeup',
      date: '2026-08-25',
      timestamp: '2026-08-25T06:00:00Z',
    });

    const rangeResult = storageAdapter.getXpEventsByDateRange('2026-08-21', '2026-08-30');
    expect(rangeResult.length).toBe(1);
    expect(rangeResult[0].date).toBe('2026-08-25');
  });

  it('should automatically generate an XpEventLog signal entry when awardXp is called', () => {
    stateService.awardXp(
      {
        amount: 80,
        statCategory: 'wisdom',
        sourceDescription: 'Read 20 pages',
      },
      'BOOK_READING_QUEST',
      'book-123'
    );

    const events = stateService.xpEvents();
    expect(events.length).toBeGreaterThan(0);

    const latest = events[0];
    expect(latest.xpAwarded).toBe(80);
    expect(latest.statType).toBe('WIS');
    expect(latest.sourceType).toBe('BOOK_READING_QUEST');
    expect(latest.sourceId).toBe('book-123');
  });
});
