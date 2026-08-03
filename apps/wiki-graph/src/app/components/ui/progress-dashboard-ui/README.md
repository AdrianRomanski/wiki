# ProgressDashboardUI Component

## Overview

A presentational UI component that displays learning progress statistics and provides filter controls for the Knowledge Progress Graph feature. This component follows strict presentation-tier rules: it receives state through Angular `input()` signals and communicates user interactions through `output()` event emitters with zero side effects.

## Purpose

- Display progress statistics across all concepts (total, not started, in progress, understood, mastered, completion percentage)
- Provide interactive filter controls to show/hide concepts by progress state
- Show last sync timestamp in human-readable format
- Emit events for filter changes and refresh requests

## Requirements Validated

**Validates: Requirements 7.1**
- Filter controls for each progress state
- Multiple filter selection support
- Display all nodes when filters disabled
- Statistics dashboard with progress summary

**Validates: Requirements 2.1, 2.3**
- File system error notification (directory creation, write, read failures)
- "Retry" action for failed writes
- "Rebuild Index" action to reconstruct index.json from concept files
- "Reload from Disk" action to manually sync progress after external changes

## Component Architecture

### Tier: Presentation (UI)

This component is **strictly presentational**:
- ✅ No service injection
- ✅ No state management
- ✅ Input-only data flow
- ✅ Output-only event emission
- ✅ OnPush change detection

### Inputs (Signals)

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `progressStats` | `ProgressStats` | Yes | Statistics object with counts for each progress state |
| `lastSyncTime` | `Date \| null` | No | Timestamp of last sync from disk, null if never synced |
| `lastError` | `string \| null` | No | User-facing file system error message (directory/write/read failure), null if none |
| `hasPendingRetry` | `boolean` | No | Whether a failed write can be retried; controls visibility of the "Retry" action |

### Outputs (Events)

| Output | Type | Description |
|--------|------|-------------|
| `filterChanged` | `ProgressState[]` | Emitted when filters change, contains array of active filter states |
| `refreshRequested` | `void` | Emitted when user clicks refresh button or the error banner's "Reload from Disk" action |
| `retryRequested` | `void` | Emitted when user clicks "Retry" on a failed write notification |
| `rebuildIndexRequested` | `void` | Emitted when user clicks "Rebuild Index" to reconstruct index.json from concept files |

### Internal State

| Signal | Type | Description |
|--------|------|-------------|
| `activeFilters` | `Set<ProgressState>` | Tracks which filters are currently active |

## Usage Example

```typescript
import { ProgressDashboardUiComponent } from './components/ui/progress-dashboard-ui/progress-dashboard-ui.component';

@Component({
  template: `
    <app-progress-dashboard-ui
      [progressStats]="stats()"
      [lastSyncTime]="lastSync()"
      (filterChanged)="handleFilterChange($event)"
      (refreshRequested)="handleRefresh()"
    />
  `
})
class MyComponent {
  stats = signal<ProgressStats>({
    total: 100,
    notStarted: 30,
    inProgress: 25,
    understood: 30,
    mastered: 15,
    percentComplete: 45
  });
  
  lastSync = signal<Date | null>(new Date());
  
  handleFilterChange(filters: ProgressState[]): void {
    // Apply filters to graph visualization
  }
  
  handleRefresh(): void {
    // Reload progress from disk
  }
}
```

## Features

### Statistics Display

- **Total Concepts**: Shows total number of tracked concepts
- **Progress State Counts**: Shows count for each state (Not Started, In Progress, Understood, Mastered)
- **Completion Percentage**: Calculated as (Understood + Mastered) / Total * 100

### Filter Controls

- **Toggle Filters**: Click to activate/deactivate individual progress state filters
- **Multiple Selection**: Multiple filters can be active simultaneously
- **Clear Filters**: Button appears when filters are active, clears all with one click
- **Visual Feedback**: Active filters highlighted with state-specific colors
- **Count Display**: Each filter button shows count of concepts in that state

### Last Sync Time

Displays human-readable sync time:
- "Never" - if never synced
- "Just now" - if less than 1 minute ago
- "N minutes ago" - for recent syncs
- "N hours ago" - for syncs within 24 hours
- "N days ago" - for older syncs

### Refresh Button

- Click to request reload of progress data from disk
- Icon rotates on hover for visual feedback
- Emits `refreshRequested` event to parent

## Color Coding

Progress states use color coding aligned with the `PROGRESS_COLORS` constants:

| State | Color | Semantic |
|-------|-------|----------|
| Not Started | Grey (#9ca3af) | Neutral, not yet begun |
| In Progress | Yellow (#fbbf24) | Active, in learning |
| Understood | Blue (#3b82f6) | Competent but not mastered |
| Mastered | Green (#10b981) | Full mastery achieved |

## Accessibility

- **ARIA Regions**: Dashboard and sections labeled with `role` and `aria-label`
- **ARIA Pressed**: Filter buttons use `aria-pressed` to indicate toggle state
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space)
- **Focus Management**: Clear focus indicators on all interactive elements

## Responsive Design

- **Desktop**: Grid layout with 6 stat cards in auto-fit columns (min 120px)
- **Tablet** (≤768px): 2-column grid for stats, stacked actions
- **Mobile** (≤480px): Single column layout for stats and filters

## Testing

Comprehensive test coverage includes:
- Statistics display verification
- Filter toggle behavior (single and multiple)
- Clear filters functionality
- Last sync time formatting
- Refresh button event emission
- Accessibility attributes
- ARIA labels and roles

Run tests:
```bash
npx nx test wiki-graph --include='**/progress-dashboard-ui.component.spec.ts'
```

## Storybook

Visual examples available in Storybook:
- Default state
- Early/Mid/Advanced learning stages
- All mastered state
- No sync state
- Small/Large datasets

Run Storybook:
```bash
npx nx storybook wiki-graph
```

## File Structure

```
progress-dashboard-ui/
├── progress-dashboard-ui.component.ts       # Component logic
├── progress-dashboard-ui.component.html     # Template
├── progress-dashboard-ui.component.scss     # Styles
├── progress-dashboard-ui.component.spec.ts  # Unit tests
├── progress-dashboard-ui.component.stories.ts # Storybook stories
└── README.md                                # This file
```

## Related Components

- **ProgressStateService** (service): Manages progress state and persistence
- **GraphVisualizerComponent** (smart): Renders graph with progress visualization
- **AssessmentDialogComponent** (ui): Handles AI assessment sessions

## Future Enhancements

- Export progress statistics to CSV/JSON
- Progress trends over time (charts)
- Filter presets (e.g., "Show concepts needing review")
- Bulk actions (e.g., "Mark all as reviewed")
