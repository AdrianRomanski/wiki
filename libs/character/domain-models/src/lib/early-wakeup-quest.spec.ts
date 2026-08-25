import { evaluateEarlyWakeupQuest } from './early-wakeup-quest.model';

describe('evaluateEarlyWakeupQuest', () => {
  function makeDate(hours: number, minutes: number): Date {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  it('returns TOO_EARLY and 0 XP before 05:00 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(4, 59));
    expect(result.slot).toBe('TOO_EARLY');
    expect(result.xpAmount).toBe(0);
    expect(result.canClaim).toBe(false);
  });

  it('returns 05:00 slot and 100 XP at 05:15 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(5, 15));
    expect(result.slot).toBe('05:00');
    expect(result.xpAmount).toBe(100);
    expect(result.canClaim).toBe(true);
  });

  it('returns 05:30 slot and 80 XP at 05:45 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(5, 45));
    expect(result.slot).toBe('05:30');
    expect(result.xpAmount).toBe(80);
    expect(result.canClaim).toBe(true);
  });

  it('returns 06:00 slot and 60 XP at 06:00 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(6, 0));
    expect(result.slot).toBe('06:00');
    expect(result.xpAmount).toBe(60);
    expect(result.canClaim).toBe(true);
  });

  it('returns 06:30 slot and 40 XP at 06:40 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(6, 40));
    expect(result.slot).toBe('06:30');
    expect(result.xpAmount).toBe(40);
    expect(result.canClaim).toBe(true);
  });

  it('returns 07:00 slot and 20 XP at 07:10 AM', () => {
    const result = evaluateEarlyWakeupQuest(makeDate(7, 10));
    expect(result.slot).toBe('07:00');
    expect(result.xpAmount).toBe(20);
    expect(result.canClaim).toBe(true);
  });

  it('returns EXPIRED and 0 XP at 07:30 AM or later', () => {
    const result730 = evaluateEarlyWakeupQuest(makeDate(7, 30));
    expect(result730.slot).toBe('EXPIRED');
    expect(result730.xpAmount).toBe(0);
    expect(result730.canClaim).toBe(false);

    const result1000 = evaluateEarlyWakeupQuest(makeDate(10, 0));
    expect(result1000.slot).toBe('EXPIRED');
    expect(result1000.xpAmount).toBe(0);
    expect(result1000.canClaim).toBe(false);
  });
});
