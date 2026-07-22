import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { GraphData } from '../../models/graph.models';
import { D3ForceRenderer } from '../../d3/d3-force-renderer';

@Component({
  selector: 'app-graph-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.scss',
})
export class GraphCanvasComponent implements OnInit, OnDestroy {
  graphData = input<GraphData | null>(null);
  visibleNodeIds = input<Set<string>>(new Set());
  selectedNodeId = input<string | null>(null);

  nodeSelected = output<string | null>();

  private readonly svgElRef = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');
  private renderer: D3ForceRenderer | null = null;

  private lastRenderedGraphData: GraphData | null = null;
  private lastRenderedVisibleNodeIds: Set<string> | undefined;

  constructor() {
    effect(() => {
      const data = this.graphData();
      const visibleNodeIds = this.visibleNodeIds();

      if (!this.renderer) return;
      if (!data) return;
      if (data === this.lastRenderedGraphData && visibleNodeIds === this.lastRenderedVisibleNodeIds) {
        return;
      }

      this.lastRenderedGraphData = data;
      this.lastRenderedVisibleNodeIds = visibleNodeIds;
      this.renderer.render(data, visibleNodeIds);
    });

    effect(() => {
      const selectedNodeId = this.selectedNodeId();

      if (!this.renderer) return;

      this.renderer.updateSelection(selectedNodeId);
    });
  }

  ngOnInit(): void {
    this.renderer = new D3ForceRenderer(
      this.svgElRef().nativeElement,
      (id) => this.nodeSelected.emit(id)
    );

    const data = this.graphData();
    if (data) {
      const visibleNodeIds = this.visibleNodeIds();
      this.lastRenderedGraphData = data;
      this.lastRenderedVisibleNodeIds = visibleNodeIds;
      this.renderer.render(data, visibleNodeIds);
    }
  }

  ngOnDestroy(): void {
    this.renderer?.destroy();
    this.renderer = null;
  }
}
