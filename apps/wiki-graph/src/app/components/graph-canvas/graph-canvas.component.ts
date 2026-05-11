import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import type { GraphData } from '../../models/graph.models';
import { D3ForceRenderer } from '../../d3/d3-force-renderer';

/**
 * Hosts the SVG element and delegates all rendering to D3ForceRenderer.
 * Angular never touches SVG nodes directly — D3 owns the SVG DOM.
 * Requirements: 2.1, 2.2, 2.6, 2.7, 2.8
 */
@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  template: `
    <svg
      #svgEl
      class="graph-svg"
      aria-label="Wiki connections graph"
      role="img"
    ></svg>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .graph-svg {
      width: 100%;
      height: 100%;
      display: block;
      background: #181825;
    }
  `],
})
export class GraphCanvasComponent implements OnInit, OnChanges, OnDestroy {
  @Input() graphData: GraphData | null = null;
  @Input() visibleNodeIds: Set<string> = new Set();
  @Input() selectedNodeId: string | null = null;

  @Output() nodeSelected = new EventEmitter<string | null>();

  private readonly svgElRef = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');
  private renderer: D3ForceRenderer | null = null;

  ngOnInit(): void {
    this.renderer = new D3ForceRenderer(
      this.svgElRef().nativeElement,
      (id) => this.nodeSelected.emit(id)
    );

    if (this.graphData) {
      this.renderer.render(this.graphData, this.visibleNodeIds);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.renderer) return;

    const dataChanged = 'graphData' in changes || 'visibleNodeIds' in changes;
    const selectionChanged = 'selectedNodeId' in changes;

    if (dataChanged && this.graphData) {
      this.renderer.render(this.graphData, this.visibleNodeIds);
    }

    if (selectionChanged) {
      this.renderer.updateSelection(this.selectedNodeId);
    }
  }

  ngOnDestroy(): void {
    this.renderer?.destroy();
    this.renderer = null;
  }
}
