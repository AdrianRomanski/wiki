import '@angular/compiler';
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { CharacterDashboardComponent } from './character-dashboard.component';

describe('CharacterDashboardComponent (ADR-0008)', () => {
  it('should instantiate dashboard component within injection context', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const component = new CharacterDashboardComponent();
      expect(component).toBeTruthy();
      expect(component.authState).toBeDefined();
      expect(component.characterState).toBeDefined();
    });
  });
});
