import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ProgressStats } from '../../../models/progress.models';
import type { ProgressState } from '../../../models/progress.models';

@Component({
  selector: 'app-progress-dashboard-ui',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-dashboard-ui.component.html',
  styleUrl: './progress-dashboard-ui.component.scss',
})
export class ProgressDashboardUiComponent {

  progressStats = input.required<ProgressStats>();
  lastSyncTime = input<Date | null>(null);

  lastError = input<string | null>(null);

  hasPendingRetry = input<boolean>(false);

  filterChanged = output<ProgressState[]>();

  refreshRequested = output<void>();

  retryRequested = output<void>();

  rebuildIndexRequested = output<void>();

  protected activeFilters = signal<Set<ProgressState>>(new Set());

  protected readonly progressStates: ProgressState[] = [
    'Not_Started',
    'In_Progress',
    'Understood',
    'Mastered'
  ];

  protected readonly stateLabels: Record<ProgressState, string> = {
    Not_Started: 'Not Started',
    In_Progress: 'In Progress',
    Understood: 'Understood',
    Mastered: 'Mastered'
  };

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

  protected clearFilters(): void {
    this.activeFilters.set(new Set());
    this.filterChanged.emit([]);
  }

  protected refresh(): void {
    this.refreshRequested.emit();
  }

  protected retry(): void {
    this.retryRequested.emit();
  }

  protected rebuildIndex(): void {
    this.rebuildIndexRequested.emit();
  }

  protected isFilterActive(state: ProgressState): boolean {
    return this.activeFilters().has(state);
  }

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
