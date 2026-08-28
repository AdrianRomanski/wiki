import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AuthCardComponent } from './auth-card.component';

describe('AuthCardComponent (ADR-0008)', () => {
  it('should instantiate component within injection context', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const component = new AuthCardComponent();
      expect(component).toBeTruthy();
      expect(component.loginRequested).toBeDefined();
      expect(component.logoutRequested).toBeDefined();
    });
  });
});
