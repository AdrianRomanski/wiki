import { Component, OnInit, inject, computed } from '@angular/core';
import { GraphCanvasComponent } from './components/graph-canvas/graph-canvas.component';
import { NodeDetailPanelComponent } from './components/node-detail-panel/node-detail-panel.component';
import { GraphStateService } from './services/graph-state.service';
import type { NodeType } from './models/graph.models';

/**
 * Route component for /wiki-graph.
 * Single unified toolbar with controls + summary stats.
 * Requirements: 2.1, 3.1, 3.4, 4.1–4.8, 5.1–5.5, 6.1, 6.4
 */
@Component({
  selector: 'app-wiki-graph-page',
  standalone: true,
  imports: [GraphCanvasComponent, NodeDetailPanelComponent],
  template: `
    <div class="wiki-graph-page">

      <!-- Full-screen canvas -->
      <app-graph-canvas
        [graphData]="graphState.graphData()"
        [visibleNodeIds]="visibleNodeIds()"
        [selectedNodeId]="graphState.selectedNode()?.id ?? null"
        (nodeSelected)="graphState.selectNode($event)"
      />

      <!-- Single unified top toolbar -->
      <div class="toolbar" role="toolbar" aria-label="Graph controls">

        <!-- Type toggles -->
        @for (type of nodeTypes; track type) {
          <button
            type="button"
            class="type-toggle"
            [class.active]="graphState.activeTypeFilters().has(type)"
            [attr.aria-pressed]="graphState.activeTypeFilters().has(type)"
            [attr.aria-label]="'Toggle ' + type + ' nodes'"
            (click)="toggleType(type)"
          >{{ type }}</button>
        }

        <div class="sep"></div>

        <!-- Search -->
        <input
          type="search"
          class="search-input"
          placeholder="Search pages…"
          [value]="graphState.searchQuery()"
          (input)="onSearch($event)"
          aria-label="Search wiki pages by title"
        />

        <!-- Tag filter -->
        <select
          class="tag-select"
          [value]="graphState.activeTagFilter() ?? ''"
          (change)="onTagChange($event)"
          aria-label="Filter nodes by tag"
        >
          <option value="">All tags</option>
          @for (tag of allTags(); track tag) {
            <option [value]="tag">{{ tag }}</option>
          }
        </select>

        <div class="sep"></div>

        <!-- Stats -->
        <span class="stat" title="Total nodes">
          <span class="stat-label">Nodes</span>{{ graphState.graphData()?.nodes?.size ?? 0 }}
        </span>
        <span class="stat" title="Total edges">
          <span class="stat-label">Edges</span>{{ graphState.graphData()?.edges?.length ?? 0 }}
        </span>
        @if (graphState.orphanNodes().length > 0) {
          <button
            type="button"
            class="stat orphan-btn"
            title="Orphan nodes — click to highlight"
            [attr.aria-label]="graphState.orphanNodes().length + ' orphan nodes, click to highlight'"
            (click)="highlightOrphans()"
          >
            <span class="stat-label">Orphans</span>{{ graphState.orphanNodes().length }}
          </button>
        } @else {
          <span class="stat" title="Orphan nodes"><span class="stat-label">Orphans</span>0</span>
        }

        <div class="sep"></div>

        <!-- Hub pills -->
        @for (node of graphState.hubNodes(); track node.id) {
          <button
            type="button"
            class="hub-pill"
            [attr.aria-label]="'Focus hub: ' + node.title"
            (click)="graphState.selectNode(node.id)"
          >
            {{ node.title }}<span class="hub-count">{{ node.inDegree + node.outDegree }}</span>
          </button>
        }

        <div class="spacer"></div>

        <!-- Refresh -->
        <button
          type="button"
          class="refresh-btn"
          aria-label="Refresh graph data"
          (click)="graphState.loadGraph()"
        >↺ Refresh</button>

      </div>

      <!-- Node detail panel — floating bottom-right -->
      <div class="overlay-bottom-right">
        <app-node-detail-panel />
      </div>

      @if (graphState.isLoading()) {
        <div class="loading-overlay" role="status" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>Loading graph…
        </div>
      }

      @if (graphState.error()) {
        <div class="error-banner" role="alert">
          <strong>Error:</strong> {{ graphState.error() }}
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100vw; height: 100vh; }

    .wiki-graph-page {
      position: relative;
      width: 100%;
      height: 100%;
      background: #181825;
      color: #cdd6f4;
      overflow: hidden;
    }

    app-graph-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    /* ── Toolbar ── */
    .toolbar {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      background: rgba(30, 30, 46, 0.92);
      backdrop-filter: blur(6px);
      border-bottom: 1px solid #313244;
      overflow-x: auto;
    }

    .sep {
      width: 1px;
      height: 1.25rem;
      background: #45475a;
      flex-shrink: 0;
      margin: 0 0.15rem;
    }

    .spacer { flex: 1; }

    /* Type toggles */
    .type-toggle {
      padding: 0.2rem 0.6rem;
      border: 1px solid #585b70;
      border-radius: 1rem;
      background: transparent;
      color: #a6adc8;
      cursor: pointer;
      font-size: 0.78rem;
      white-space: nowrap;
      transition: background 0.12s, border-color 0.12s, color 0.12s;
    }
    .type-toggle.active {
      background: #313244;
      border-color: #89b4fa;
      color: #89b4fa;
    }
    .type-toggle:focus-visible { outline: 2px solid #89b4fa; outline-offset: 2px; }

    /* Search */
    .search-input {
      padding: 0.25rem 0.5rem;
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 4px;
      color: #cdd6f4;
      font-size: 0.8rem;
      width: 140px;
    }
    .search-input:focus { outline: 2px solid #89b4fa; border-color: #89b4fa; }

    /* Tag select */
    .tag-select {
      padding: 0.25rem 0.4rem;
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 4px;
      color: #cdd6f4;
      font-size: 0.8rem;
      max-width: 130px;
    }
    .tag-select:focus { outline: 2px solid #89b4fa; border-color: #89b4fa; }

    /* Stats */
    .stat {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.8rem;
      color: #cdd6f4;
      white-space: nowrap;
    }
    .stat-label {
      font-size: 0.65rem;
      color: #585b70;
      margin-right: 0.1rem;
    }

    button.stat, .orphan-btn {
      background: none;
      border: 1px solid #f38ba8;
      border-radius: 4px;
      color: #f38ba8;
      cursor: pointer;
      padding: 0.1rem 0.35rem;
    }
    .orphan-btn:hover { background: rgba(243,139,168,0.1); }
    .orphan-btn:focus-visible { outline: 2px solid #f38ba8; outline-offset: 2px; }

    /* Hub pills */
    .hub-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #313244;
      border: 1px solid transparent;
      border-radius: 1rem;
      padding: 0.15rem 0.55rem;
      cursor: pointer;
      color: #cdd6f4;
      font-size: 0.75rem;
      white-space: nowrap;
      transition: border-color 0.12s, background 0.12s;
    }
    .hub-pill:hover { background: #45475a; border-color: #585b70; }
    .hub-pill:focus-visible { outline: 2px solid #89b4fa; outline-offset: 2px; }

    .hub-count {
      background: #45475a;
      border-radius: 1rem;
      padding: 0 0.3rem;
      font-size: 0.65rem;
      color: #a6adc8;
    }

    /* Refresh */
    .refresh-btn {
      padding: 0.25rem 0.7rem;
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 4px;
      color: #cdd6f4;
      cursor: pointer;
      font-size: 0.8rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .refresh-btn:hover { background: #45475a; }
    .refresh-btn:focus-visible { outline: 2px solid #89b4fa; outline-offset: 2px; }

    /* Node detail overlay */
    .overlay-bottom-right {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      z-index: 10;
      max-width: 280px;
      pointer-events: auto;
    }

    /* Loading / error */
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: rgba(24, 24, 37, 0.8);
      z-index: 20;
      font-size: 1rem;
      color: #a6adc8;
    }

    .spinner {
      width: 20px; height: 20px;
      border: 2px solid #585b70;
      border-top-color: #89b4fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      position: absolute;
      top: 4rem; left: 50%;
      transform: translateX(-50%);
      background: #3b1219;
      border: 1px solid #f38ba8;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      color: #f38ba8;
      font-size: 0.875rem;
      z-index: 20;
      max-width: 480px;
      text-align: center;
    }
  `],
})
export class WikiGraphPageComponent implements OnInit {
  readonly graphState = inject(GraphStateService);
  readonly nodeTypes: NodeType[] = ['entity', 'concept', 'source'];

  readonly visibleNodeIds = computed(() =>
    new Set(this.graphState.visibleNodes().map(n => n.id))
  );

  readonly allTags = () => this.graphState.graphData()?.allTags ?? [];

  ngOnInit(): void {
    this.graphState.loadGraph();
  }

  toggleType(type: NodeType): void {
    const active = this.graphState.activeTypeFilters().has(type);
    this.graphState.setTypeFilter(type, !active);
  }

  onSearch(event: Event): void {
    this.graphState.setSearchQuery((event.target as HTMLInputElement).value);
  }

  onTagChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.graphState.setTagFilter(value || null);
  }

  highlightOrphans(): void {
    const orphans = this.graphState.orphanNodes();
    if (orphans.length > 0) this.graphState.selectNode(orphans[0].id);
  }
}
