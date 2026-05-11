import { Component, inject } from '@angular/core';
import { GraphStateService } from '../../services/graph-state.service';

/**
 * Displays graph statistics: total nodes/edges, orphan count, and top-5 hub nodes.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
@Component({
  selector: 'app-graph-summary-panel',
  standalone: true,
  template: `
    <aside class="summary-panel" aria-label="Graph summary">
      <h2 class="panel-title">Graph Summary</h2>

      <!-- Totals — Requirement 5.5 -->
      <dl class="stats">
        <dt>Nodes</dt>
        <dd>{{ graphData()?.nodes?.size ?? 0 }}</dd>

        <dt>Edges</dt>
        <dd>{{ graphData()?.edges?.length ?? 0 }}</dd>

        <!-- Orphan count — Requirement 5.1, 5.4 -->
        <dt>Orphans</dt>
        <dd>
          @if (orphanNodes().length > 0) {
            <button
              type="button"
              class="orphan-count-btn"
              [attr.aria-label]="'Highlight ' + orphanNodes().length + ' orphan nodes'"
              (click)="highlightOrphans()"
            >
              {{ orphanNodes().length }}
            </button>
          } @else {
            0
          }
        </dd>
      </dl>

      <!-- Hub nodes — Requirement 5.2, 5.3 -->
      <section class="hubs-section" aria-label="Top hub nodes">
        <span class="section-title">Hubs:</span>
        @if (hubNodes().length > 0) {
          <ul class="hub-list" aria-label="Hub nodes by connection count">
            @for (node of hubNodes(); track node.id) {
              <li>
                <button
                  type="button"
                  class="hub-btn"
                  [attr.aria-label]="'Select hub node: ' + node.title + ', ' + (node.inDegree + node.outDegree) + ' connections'"
                  (click)="graphState.selectNode(node.id)"
                >
                  {{ node.title }}
                  <span class="hub-count" aria-hidden="true">{{ node.inDegree + node.outDegree }}</span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="empty-state">No data loaded</p>
        }
      </section>
    </aside>
  `,
  styles: [`
    .summary-panel {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 0 1rem;
      background: #1e1e2e;
      border-bottom: 1px solid #313244;
      border-left: 1px solid #313244;
      color: #cdd6f4;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .panel-title {
      display: none;
    }

    .stats {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    dt {
      font-size: 0.75rem;
      color: #a6adc8;
    }

    dd {
      margin: 0 0.75rem 0 0.2rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #cdd6f4;
    }

    .orphan-count-btn {
      background: none;
      border: 1px solid #f38ba8;
      border-radius: 4px;
      color: #f38ba8;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0 0.4rem;
      line-height: 1.4;
    }

    .orphan-count-btn:hover { background: rgba(243,139,168,0.1); }

    .orphan-count-btn:focus-visible {
      outline: 2px solid #f38ba8;
      outline-offset: 2px;
    }

    .section-title {
      font-size: 0.75rem;
      color: #a6adc8;
      margin: 0 0.25rem 0 0;
    }

    .hubs-section {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .hub-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .hub-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: #313244;
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      color: #cdd6f4;
      font-size: 0.75rem;
      transition: border-color 0.15s, background 0.15s;
      white-space: nowrap;
    }

    .hub-btn:hover {
      background: #45475a;
      border-color: #585b70;
    }

    .hub-btn:focus-visible {
      outline: 2px solid #89b4fa;
      outline-offset: 2px;
    }

    .hub-count {
      background: #45475a;
      border-radius: 1rem;
      padding: 0.05rem 0.35rem;
      font-size: 0.65rem;
      color: #a6adc8;
    }

    .empty-state {
      font-size: 0.75rem;
      color: #585b70;
      font-style: italic;
      margin: 0;
    }
  `],
})
export class GraphSummaryPanelComponent {
  readonly graphState = inject(GraphStateService);

  readonly graphData = this.graphState.graphData;
  readonly hubNodes = this.graphState.hubNodes;
  readonly orphanNodes = this.graphState.orphanNodes;

  /** Highlight all orphan nodes by selecting the first one (visual cue). Requirement 5.4 */
  highlightOrphans(): void {
    const orphans = this.orphanNodes();
    if (orphans.length > 0) {
      this.graphState.selectNode(orphans[0].id);
    }
  }
}
