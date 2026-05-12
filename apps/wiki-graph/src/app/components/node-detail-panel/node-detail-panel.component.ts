import {
  Component,
  ElementRef,
  HostListener,
  inject,
  effect,
  viewChild,
} from '@angular/core';
import { GraphStateService } from '../../services/graph-state.service';

/**
 * Displays details for the currently selected node.
 * Receives focus when a node is selected; dismisses on Escape.
 * Requirements: 3.2, 3.5, 3.6
 */
@Component({
  selector: 'app-node-detail-panel',
  standalone: true,
  template: `
    @if (selectedNode()) {
      <section
        #panel
        class="node-detail-panel"
        role="region"
        aria-label="Node details"
        tabindex="-1"
      >
        <header class="panel-header">
          <h2 class="node-title">{{ selectedNode()!.title }}</h2>
          <button
            type="button"
            class="close-btn"
            aria-label="Close node details"
            (click)="close()"
          >✕</button>
        </header>

        @if (selectedNode()!.isGhost) {
          <p class="ghost-indicator" role="status">
            ⚠ This page does not exist in the wiki (broken link target).
          </p>
        }

        <dl class="node-meta">
          <dt>Type</dt>
          <dd>
            <span class="type-badge type-{{ selectedNode()!.type }}">
              {{ selectedNode()!.type }}
            </span>
          </dd>

          <dt>Tags</dt>
          <dd>
            @if (selectedNode()!.tags.length > 0) {
              <ul class="tag-list" aria-label="Tags">
                @for (tag of selectedNode()!.tags; track tag) {
                  <li class="tag">{{ tag }}</li>
                }
              </ul>
            } @else {
              <span class="empty">None</span>
            }
          </dd>

          <dt>Outgoing links</dt>
          <dd>{{ selectedNode()!.outDegree }}</dd>

          <dt>Incoming links</dt>
          <dd>{{ selectedNode()!.inDegree }}</dd>
        </dl>
      </section>
    }
  `,
  styles: [`
    .node-detail-panel {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      width: 280px;
      max-height: calc(100vh - 6rem);
      overflow-y: auto;
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      z-index: 10;
      color: #cdd6f4;
      animation: panel-in 0.15s ease-out;
    }

    @keyframes panel-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .node-detail-panel:focus {
      outline: 2px solid #89b4fa;
      outline-offset: 2px;
    }

    .panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .node-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: #cdd6f4;
      word-break: break-word;
    }

    .close-btn {
      background: none;
      border: none;
      color: #a6adc8;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .close-btn:hover { color: #cdd6f4; }

    .close-btn:focus-visible {
      outline: 2px solid #89b4fa;
      outline-offset: 2px;
    }

    .ghost-indicator {
      background: #45475a;
      border-left: 3px solid #f38ba8;
      padding: 0.4rem 0.6rem;
      border-radius: 0 4px 4px 0;
      font-size: 0.8rem;
      color: #f38ba8;
      margin-bottom: 0.75rem;
    }

    .node-meta {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.4rem 0.75rem;
      margin: 0;
    }

    dt {
      font-size: 0.75rem;
      color: #a6adc8;
      font-weight: 500;
      align-self: start;
      padding-top: 0.1rem;
    }

    dd {
      margin: 0;
      font-size: 0.875rem;
      color: #cdd6f4;
    }

    .type-badge {
      display: inline-block;
      padding: 0.1rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .type-entity  { background: #1e3a5f; color: #89b4fa; }
    .type-concept { background: #2d1e5f; color: #cba6f7; }
    .type-source  { background: #1e3a2d; color: #a6e3a1; }

    .tag-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .tag {
      background: #313244;
      border: 1px solid #585b70;
      border-radius: 1rem;
      padding: 0.1rem 0.5rem;
      font-size: 0.75rem;
      color: #a6adc8;
    }

    .empty {
      color: #585b70;
      font-style: italic;
    }
  `],
})
export class NodeDetailPanelComponent {
  readonly graphState = inject(GraphStateService);
  readonly selectedNode = this.graphState.selectedNode;

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Move focus to the panel whenever a node is selected — Requirement 3.6
    effect(() => {
      const node = this.selectedNode();
      if (node) {
        // Defer to allow the DOM to render first
        setTimeout(() => this.panelRef()?.nativeElement.focus(), 0);
      }
    });
  }

  /** Dismiss on Escape key — Requirement 3.6 */
  @HostListener('keydown.escape')
  close(): void {
    this.graphState.selectNode(null);
  }
}
