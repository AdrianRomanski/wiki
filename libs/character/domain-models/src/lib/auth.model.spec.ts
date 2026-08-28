import { describe, expect, it } from 'vitest';
import {
  createBaselineLevel1Character,
  evaluateEmailAllowlist,
} from './auth.model';

describe('Auth Domain Models & Pure Functions', () => {
  describe('evaluateEmailAllowlist', () => {
    const mockAllowlist = ['user@example.com', 'admin@forge.org', 'test.member@gmail.com'];

    it('should return true for authorized emails regardless of casing or padding', () => {
      expect(evaluateEmailAllowlist('USER@EXAMPLE.COM', mockAllowlist)).toBe(true);
      expect(evaluateEmailAllowlist('  admin@forge.org  ', mockAllowlist)).toBe(true);
      expect(evaluateEmailAllowlist('Test.Member@gmail.com', mockAllowlist)).toBe(true);
    });

    it('should return false for unauthorized emails', () => {
      expect(evaluateEmailAllowlist('hacker@darknet.io', mockAllowlist)).toBe(false);
      expect(evaluateEmailAllowlist('user@example.net', mockAllowlist)).toBe(false);
    });

    it('should return false for null, undefined, or empty inputs', () => {
      expect(evaluateEmailAllowlist(null, mockAllowlist)).toBe(false);
      expect(evaluateEmailAllowlist(undefined, mockAllowlist)).toBe(false);
      expect(evaluateEmailAllowlist('', mockAllowlist)).toBe(false);
      expect(evaluateEmailAllowlist('   ', mockAllowlist)).toBe(false);
    });
  });

  describe('createBaselineLevel1Character', () => {
    it('should initialize a baseline character strictly at Level 1 with 0 XP', () => {
      const char = createBaselineLevel1Character('user-123', 'hero@realm.org', 'Sir Hero');

      expect(char.id).toBe('user-123');
      expect(char.name).toBe('Sir Hero');
      expect(char.level).toBe(1);
      expect(char.currentXp).toBe(0);
      expect(char.totalXpEarned).toBe(0);
      expect(char.attributes).toEqual({
        intelligence: 10,
        wisdom: 10,
        discipline: 10,
      });
      expect(char.title).toBe('Novice Scholar');
    });

    it('should derive default name from email prefix if displayName is missing', () => {
      const char = createBaselineLevel1Character('uid-456', 'adrian.romanski@gmail.com');
      expect(char.name).toBe('adrian.romanski');
      expect(char.level).toBe(1);
    });
  });
});
