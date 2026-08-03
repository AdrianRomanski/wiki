import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ProgressStats } from '../../../models/progress.models';
import type { ProgressState } from '../../../models/progress.models';

/**
 * Progress Dashboard UI Component
 * 
 * A presentational component that displays progress statistics and filter controls.
 * Purely UI-focused with no side effects - receives state through signals and
 * communicates user interactions through output events.
 * 
 * **Validates: Requirements 7.1**
 */
@Component({
  selector: 'app-progress-dashboard-ui',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-dashboard-ui.component.html',
  styleUrl: './progress-dashboard-ui.component.scss',
})
export class ProgressDashboardUiComponent {
  // Inputs - state received from parent
  progressStats = input.required<ProgressStats>();
  lastSyncTime = input<Date | null>(null);
  /**
   * User-facing message describing the most recent file system error
   * (directory creation failure, write failure, read failure/corruption),
   * or null if there is no active error to report.
   *
   * Requirements: 2.1, 2.3
   */
  lastError = input<string | null>(null);
  /**
   * Whether there is a failed progress write that can be retried via
   * `retryRequested`. When false, the error banner's "Retry" action is
   * hidden since there is nothing to retry (e.g. a read/corruption error).
   */
  hasPendingRetry = input<boolean>(false);

  // Outputs - events emitted to parent
  filterChanged = output<ProgressState[]>();
  /**
   * Emitted when the user requests a reload of progress data from disk,
   * whether via the general "Refresh" action or the error banner's
   * "Reload from Disk" action (both trigger the same
   * ProgressStateService.refreshFromDisk() flow).
   *
   * Requirements: 2.1, 2.3
   */
  refreshRequested = output<void>();
  /** Emitted when the user clicks "Retry" on a failed write notification. */
  retryRequested = output<void>();
  /** Emitted when the user clicks "Rebuild Index" to reconstruct index.json from concept files. */
  rebuildIndexRequested = output<void>();
  
  // Internal state - selected filters
  protected activeFilters = signal<Set<ProgressState>>(new Set());
  
  // All possible progress states for filter controls
  protected readonly progressStates: ProgressState[] = [
    'Not_Started',
    'In_Progress',
    'Understood',
    'Mastered'
  ];
  
  // Human-readable labels for progress states
  protected readonly stateLabels: Record<ProgressState, string> = {
    Not_Started: 'Not Started',
    In_Progress: 'In Progress',
    Understood: 'Understood',
    Mastered: 'Mastered'
  };
  
  // Computed: formatted last sync time
  protected lastSyncFormatted = computed(() => {
    const time = this.lastSyncTime();
    if (!time) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  });
  
  /**
   * Toggle a progress state filter on/off
   */
  protected toggleFilter(state: ProgressState): void {
    const current = new Set(this.activeFilters());
    
    if (current.has(state)) {
      current.delete(state);
    } else {
      current.add(state);
    }
    
    this.activeFilters.set(current);
    this.filterChanged.emit(Array.from(current));
  }
  
  /**
   * Clear all filters and show all nodes
   */
  protected clearFilters(): void {
    this.activeFilters.set(new Set());
    this.filterChanged.emit([]);
  }
  
  /**
   * Emit refresh event to trigger reload from disk.
   * Used both by the general "Refresh" action and the error banner's
   * "Reload from Disk" action - both request the same
   * ProgressStateService.refreshFromDisk() flow.
   *
   * Requirements: 2.1, 2.3
   */
  protected refresh(): void {
    this.refreshRequested.emit();
  }

  /**
   * Emit retry event to re-attempt the most recent failed progress write.
   *
   * Requirements: 2.3
   */
  protected retry(): void {
    this.retryRequested.emit();
  }

  /**
   * Emit rebuild-index event to manually reconstruct index.json from the
   * concept files on disk.
   *
   * Requirements: 2.1
   */
  protected rebuildIndex(): void {
    this.rebuildIndexRequested.emit();
  }
  
  /**
   * Check if a filter is currently active
   */
  protected isFilterActive(state: ProgressState): boolean {
    return this.activeFilters().has(state);
  }
  
  /**
   * Get count for a specific progress state
   */
  protected getCount(state: ProgressState): number {
    const stats = this.progressStats();
    switch (state) {
      case 'Not_Started': return stats.notStarted;
      case 'In_Progress': return stats.inProgress;
      case 'Understood': return stats.understood;
      case 'Mastered': return stats.mastered;
    }
  }
}
