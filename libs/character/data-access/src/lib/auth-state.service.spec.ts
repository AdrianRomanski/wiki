import { describe, expect, it } from 'vitest';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService (ADR-0008)', () => {
  it('should initialize with idle status and empty allowlist by default', () => {
    const service = new AuthStateService();
    expect(service.authStatus()).toBe('idle');
    expect(service.user()).toBeNull();
    expect(service.allowlist()).toEqual([]);
  });

  it('should allow setting allowlist dynamically', () => {
    const service = new AuthStateService();
    service.setAllowlist(['custom.hero@realm.org']);
    expect(service.allowlist()).toContain('custom.hero@realm.org');
  });

  it('should successfully authenticate permitted emails and set status to authenticated', async () => {
    const service = new AuthStateService();
    service.setAllowlist(['permitted@example.com']);
    const success = await service.loginWithGoogle('permitted@example.com');

    expect(success).toBe(true);
    expect(service.authStatus()).toBe('authenticated');
    expect(service.user()).not.toBeNull();
    expect(service.user()?.email).toBe('permitted@example.com');
    expect(service.user()?.level).toBe(1);
    expect(service.user()?.totalXp).toBe(0);
  });

  it('should reject unauthorized emails and set status to unauthorized', async () => {
    const service = new AuthStateService();
    service.setAllowlist(['permitted@example.com']);
    const success = await service.loginWithGoogle('hacker@unauthorized.com');

    expect(success).toBe(false);
    expect(service.authStatus()).toBe('unauthorized');
    expect(service.user()).toBeNull();
  });

  it('should reset user session on logout', async () => {
    const service = new AuthStateService();
    service.setAllowlist(['permitted@example.com']);
    await service.loginWithGoogle('permitted@example.com');
    expect(service.authStatus()).toBe('authenticated');

    service.logout();
    expect(service.authStatus()).toBe('unauthenticated');
    expect(service.user()).toBeNull();
  });

  it('should generate a baseline Level 1 character for authenticated user', async () => {
    const service = new AuthStateService();
    service.setAllowlist(['permitted@example.com']);
    await service.loginWithGoogle('permitted@example.com');
    const char = service.getBaselineLevel1Character();

    expect(char.level).toBe(1);
    expect(char.currentXp).toBe(0);
    expect(char.totalXpEarned).toBe(0);
    expect(char.attributes).toEqual({
      intelligence: 10,
      wisdom: 10,
      discipline: 10,
    });
  });
});
