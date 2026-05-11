import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { NodeType } from '../../models/graph.models';
import { GraphStateService } from '../../services/graph-state.service';

/**
 * Renders type toggle buttons, search input, tag filter, and refresh button.
 * Requirements: 4.1, 4.2, 4.3, 4.6, 4.8, 6.1
 */
@Component({
  selector: 'app-graph-controls',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="graph-controls" role="toolbar" aria-label="Graph filter controls">

      <!-- Type filter toggles — Requirement 4.1, 4.2 -->
      <fieldset class="type-filters">
        <legend>Node types</legend>
        @for (type of nodeTypes; track type) {
          <button
            type="button"
            class="type-toggle"
            [class.active]="activeTypeFilters().has(type)"
            [attr.aria-pressed]="activeTypeFilters().has(type)"
            [attr.aria-label]="'Toggle ' + type + ' nodes'"
            (click)="toggleType(type)"
          >
            {{ type }}
          </button>
        }
      </fieldset>

      <!-- Search input — Requirement 4.3 -->
      <div class="search-field">
        <label for="graph-search">Search pages</label>
        <input
          id="graph-search"
          type="search"
          placeholder="Filter by title…"
          [value]="searchQuery()"
          (input)="onSearch($event)"
          aria-label="Search wiki pages by title"
        />
      </div>

      <!-- Tag filter — Requirement 4.6 -->
      <div class="tag-filter">
        <label for="graph-tag-filter">Filter by tag</label>
        <select
          id="graph-tag-filter"
          [value]="activeTagFilter() ?? ''"
          (change)="onTagChange($event)"
          aria-label="Filter nodes by tag"
        >
          <option value="">All tags</option>
          @for (tag of allTags(); track tag) {
            <option [value]="tag">{{ tag }}</option>
          }
        </select>
      </div>

      <!-- Refresh button — Requirement 6.1 -->
      <button
        type="button"
        class="refresh-btn"
        aria-label="Refresh graph data"
        (click)="graphState.loadGraph()"
      >
        Refresh
      </button>

    </div>
  `,
  styles: [`
    .graph-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #1e1e2e;
      border-bottom: 1px solid #313244;
    }

    fieldset.type-filters {
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    legend {
      font-size: 0.75rem;
      color: #a6adc8;
      margin-right: 0.5rem;
      float: left;
      line-height: 2;
    }

    .type-toggle {
      padding: 0.25rem 0.75rem;
      border: 2px solid #585b70;
      border-radius: 1rem;
      background: transparent;
      color: #cdd6f4;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.15s, border-color 0.15s;
    }

    .type-toggle.active {
      background: #313244;
      border-color: #89b4fa;
      color: #89b4fa;
    }

    .type-toggle:focus-visible {
      outline: 2px solid #89b4fa;
      outline-offset: 2px;
    }

    .search-field,
    .tag-filter {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    label {
      font-size: 0.75rem;
      color: #a6adc8;
    }

    input[type="search"],
    select {
      padding: 0.3rem 0.6rem;
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 4px;
      color: #cdd6f4;
      font-size: 0.875rem;
      min-width: 160px;
    }

    input[type="search"]:focus,
    select:focus {
      outline: 2px solid #89b4fa;
      outline-offset: 1px;
      border-color: #89b4fa;
    }

    .refresh-btn {
      padding: 0.35rem 1rem;
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 4px;
      color: #cdd6f4;
      cursor: pointer;
      font-size: 0.875rem;
      margin-left: auto;
    }

    .refresh-btn:hover {
      background: #45475a;
    }

    .refresh-btn:focus-visible {
      outline: 2px solid #89b4fa;
      outline-offset: 2px;
    }
  `],
})
export class GraphControlsComponent {
  readonly graphState = inject(GraphStateService);

  readonly nodeTypes: NodeType[] = ['entity', 'concept', 'source'];

  // Expose signals for template binding
  readonly activeTypeFilters = this.graphState.activeTypeFilters;
  readonly searchQuery = this.graphState.searchQuery;
  readonly activeTagFilter = this.graphState.activeTagFilter;

  readonly allTags = () => this.graphState.graphData()?.allTags ?? [];

  toggleType(type: NodeType): void {
    const isActive = this.activeTypeFilters().has(type);
    this.graphState.setTypeFilter(type, !isActive);
  }

  onSearch(event: Event): void {
    this.graphState.setSearchQuery((event.target as HTMLInputElement).value);
  }

  onTagChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.graphState.setTagFilter(value || null);
  }
}
