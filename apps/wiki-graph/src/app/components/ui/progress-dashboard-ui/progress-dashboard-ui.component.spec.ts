import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressDashboardUiComponent } from './progress-dashboard-ui.component';
import type { ProgressStats } from '../../../models/progress.models';

describe('ProgressDashboardUiComponent', () => {
  let component: ProgressDashboardUiComponent;
  let fixture: ComponentFixture<ProgressDashboardUiComponent>;

  const mockStats: ProgressStats = {
    total: 100,
    notStarted: 30,
    inProgress: 25,
    understood: 30,
    mastered: 15,
    percentComplete: 45
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressDashboardUiComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressDashboardUiComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('progressStats', mockStats);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Statistics Display', () => {
    it('should display all progress statistics', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.textContent).toContain('100'); // total
      expect(compiled.textContent).toContain('30'); // notStarted
      expect(compiled.textContent).toContain('25'); // inProgress
      expect(compiled.textContent).toContain('30'); // understood (appears twice)
      expect(compiled.textContent).toContain('15'); // mastered
      expect(compiled.textContent).toContain('45%'); // percentComplete
    });

    it('should display stat labels', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.textContent).toContain('Total Concepts');
      expect(compiled.textContent).toContain('Not Started');
      expect(compiled.textContent).toContain('In Progress');
      expect(compiled.textContent).toContain('Understood');
      expect(compiled.textContent).toContain('Mastered');
      expect(compiled.textContent).toContain('Complete');
    });
  });

  describe('Filter Controls', () => {
    it('should render filter buttons for all progress states', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      
      expect(filterButtons.length).toBe(4);
    });

    it('should toggle filter on button click', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButton = compiled.querySelector('.filter-btn') as HTMLButtonElement;
      
      let emittedFilters: any = null;
      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      filterButton.click();
      fixture.detectChanges();

      expect(emittedFilters).toEqual(['Not_Started']);
      expect(filterButton.getAttribute('aria-pressed')).toBe('true');
    });

    it('should allow multiple filters to be active', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>;
      
      let emittedFilters: any = null;
      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Click first filter
      filterButtons[0].click();
      fixture.detectChanges();
      
      expect(emittedFilters?.length).toBe(1);

      // Click second filter
      filterButtons[1].click();
      fixture.detectChanges();
      
      expect(emittedFilters?.length).toBe(2);
    });

    it('should deactivate filter when clicked again', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButton = compiled.querySelector('.filter-btn') as HTMLButtonElement;
      
      let emittedFilters: any = null;
      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Activate filter
      filterButton.click();
      fixture.detectChanges();
      expect(emittedFilters?.length).toBe(1);

      // Deactivate filter
      filterButton.click();
      fixture.detectChanges();
      expect(emittedFilters?.length).toBe(0);
      expect(filterButton.getAttribute('aria-pressed')).toBe('false');
    });

    it('should display clear filters button when filters are active', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      // No clear button initially
      expect(compiled.querySelector('.clear-filters-btn')).toBeNull();

      // Activate a filter
      const filterButton = compiled.querySelector('.filter-btn') as HTMLButtonElement;
      filterButton.click();
      fixture.detectChanges();

      // Clear button should appear
      expect(compiled.querySelector('.clear-filters-btn')).toBeTruthy();
    });

    it('should clear all filters when clear button clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      let emittedFilters: any = null;
      component.filterChanged.subscribe((filters) => {
        emittedFilters = filters;
      });

      // Activate multiple filters
      const filterButtons = compiled.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>;
      filterButtons[0].click();
      filterButtons[1].click();
      fixture.detectChanges();

      // Click clear button
      const clearButton = compiled.querySelector('.clear-filters-btn') as HTMLButtonElement;
      clearButton.click();
      fixture.detectChanges();

      expect(emittedFilters).toEqual([]);
    });

    it('should display correct counts for each filter', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButtons = compiled.querySelectorAll('.filter-btn');
      
      // Check that each filter button shows its count
      expect(filterButtons[0].textContent).toContain('30'); // Not Started
      expect(filterButtons[1].textContent).toContain('25'); // In Progress
      expect(filterButtons[2].textContent).toContain('30'); // Understood
      expect(filterButtons[3].textContent).toContain('15'); // Mastered
    });
  });

  describe('Last Sync Time', () => {
    it('should display "Never" when lastSyncTime is null', () => {
      fixture.componentRef.setInput('lastSyncTime', null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Never');
    });

    it('should display "Just now" for very recent sync', () => {
      const now = new Date();
      fixture.componentRef.setInput('lastSyncTime', now);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Just now');
    });

    it('should display minutes ago for recent sync', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      fixture.componentRef.setInput('lastSyncTime', fiveMinutesAgo);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('5 minutes ago');
    });

    it('should display hours ago for older sync', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      fixture.componentRef.setInput('lastSyncTime', twoHoursAgo);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2 hours ago');
    });

    it('should display days ago for very old sync', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      fixture.componentRef.setInput('lastSyncTime', threeDaysAgo);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('3 days ago');
    });
  });

  describe('Refresh Button', () => {
    it('should emit refreshRequested event when clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      let refreshEmitted = false;
      component.refreshRequested.subscribe(() => {
        refreshEmitted = true;
      });

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      refreshButton.click();

      expect(refreshEmitted).toBe(true);
    });
  });

  describe('Error Banner (Requirements 2.1, 2.3)', () => {
    it('should not render the error banner when there is no error', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-banner')).toBeNull();
    });

    it('should render the error message when lastError is set', () => {
      fixture.componentRef.setInput('lastError', 'Failed to save progress for TypeScript: Disk full');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const banner = compiled.querySelector('.error-banner');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Disk full');
    });

    it('should show the Retry button only when hasPendingRetry is true', () => {
      fixture.componentRef.setInput('lastError', 'Failed to save progress for TypeScript: Disk full');
      fixture.componentRef.setInput('hasPendingRetry', false);
      fixture.detectChanges();

      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.retry-btn')).toBeNull();

      fixture.componentRef.setInput('hasPendingRetry', true);
      fixture.detectChanges();

      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.retry-btn')).toBeTruthy();
    });

    it('should emit retryRequested when Retry is clicked', () => {
      fixture.componentRef.setInput('lastError', 'Failed to save progress for TypeScript: Disk full');
      fixture.componentRef.setInput('hasPendingRetry', true);
      fixture.detectChanges();

      let retryEmitted = false;
      component.retryRequested.subscribe(() => {
        retryEmitted = true;
      });

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('.retry-btn') as HTMLButtonElement).click();

      expect(retryEmitted).toBe(true);
    });

    it('should emit rebuildIndexRequested when Rebuild Index is clicked', () => {
      fixture.componentRef.setInput('lastError', 'Some progress data could not be loaded. 2 concepts affected.');
      fixture.detectChanges();

      let rebuildEmitted = false;
      component.rebuildIndexRequested.subscribe(() => {
        rebuildEmitted = true;
      });

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('.rebuild-index-btn') as HTMLButtonElement).click();

      expect(rebuildEmitted).toBe(true);
    });

    it('should emit refreshRequested when Reload from Disk is clicked', () => {
      fixture.componentRef.setInput('lastError', 'Some progress data could not be loaded. 2 concepts affected.');
      fixture.detectChanges();

      let refreshEmitted = false;
      component.refreshRequested.subscribe(() => {
        refreshEmitted = true;
      });

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('.reload-btn') as HTMLButtonElement).click();

      expect(refreshEmitted).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for the dashboard', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dashboard = compiled.querySelector('.progress-dashboard');
      
      expect(dashboard?.getAttribute('role')).toBe('region');
      expect(dashboard?.getAttribute('aria-label')).toBe('Progress Dashboard');
    });

    it('should have proper ARIA labels for statistics section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const statsSection = compiled.querySelector('.stats-section');
      
      expect(statsSection?.getAttribute('role')).toBe('group');
      expect(statsSection?.getAttribute('aria-label')).toBe('Progress statistics');
    });

    it('should have proper ARIA labels for filters section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filtersSection = compiled.querySelector('.filters-section');
      
      expect(filtersSection?.getAttribute('role')).toBe('group');
      expect(filtersSection?.getAttribute('aria-label')).toBe('Progress filters');
    });

    it('should have aria-pressed attribute on filter buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filterButton = compiled.querySelector('.filter-btn') as HTMLButtonElement;
      
      expect(filterButton.hasAttribute('aria-pressed')).toBe(true);
      expect(filterButton.getAttribute('aria-pressed')).toBe('false');
      
      filterButton.click();
      fixture.detectChanges();
      
      expect(filterButton.getAttribute('aria-pressed')).toBe('true');
    });

    it('should have descriptive aria-label for refresh button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      expect(refreshButton.getAttribute('aria-label')).toBe('Refresh progress from disk');
    });
  });
});
