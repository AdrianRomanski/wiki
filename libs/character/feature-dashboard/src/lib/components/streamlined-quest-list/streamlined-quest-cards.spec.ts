import '@angular/compiler';
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { DailyStudyQuestCardComponent } from './daily-study-quest-card.component';
import { DailyReadingQuestCardComponent } from './daily-reading-quest-card.component';
import { DailyWakeupQuestCardComponent } from './daily-wakeup-quest-card.component';

describe('Streamlined Quest Cards (ADR-0013 UI Components)', () => {
  it('should instantiate DailyStudyQuestCardComponent', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const comp = new DailyStudyQuestCardComponent();
      expect(comp).toBeTruthy();
      expect(comp.isNotesOpen()).toBe(false);
    });
  });

  it('should instantiate DailyReadingQuestCardComponent with default 15 pages', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const comp = new DailyReadingQuestCardComponent();
      expect(comp).toBeTruthy();
      expect(comp.pagesReadInput()).toBe(15);
      comp.incrementPages();
      expect(comp.pagesReadInput()).toBe(15);
      comp.decrementPages();
      expect(comp.pagesReadInput()).toBe(10);
      comp.setPages(25);
      expect(comp.pagesReadInput()).toBe(15);
    });
  });

  it('should instantiate DailyWakeupQuestCardComponent with simulation toggle', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const comp = new DailyWakeupQuestCardComponent();
      expect(comp).toBeTruthy();
      expect(comp.isSimOpen()).toBe(false);
      comp.isSimOpen.set(true);
      expect(comp.isSimOpen()).toBe(true);
    });
  });
});
