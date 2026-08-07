import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { GraphData } from '../../../models/graph.models';
import type { ProgressState } from '../../../models/progress.models';
import { PROGRESS_STATE_LABELS, type VisualizationMode } from '../../../models/progress.constants';
import { D3ForceRenderer } from '../../../d3/d3-force-renderer';

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

  visualizationMode$ = input<VisualizationMode>('wiki');

  progressStates$ = input<ReadonlyMap<string, ProgressState>>(new Map());

  activeFilters$ = input<ProgressState[]>([]);

  nodeSelected = output<string | null>();

  assessmentRequested = output<string>();

  protected readonly progressAnnouncement = signal('');

  private readonly svgElRef = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');
  private renderer: D3ForceRenderer | null = null;

  private lastRenderedGraphData: GraphData | null = null;
  private lastRenderedVisibleNodeIds: Set<string> | undefined;
  private lastProgressStates: ReadonlyMap<string, ProgressState> | null = null;

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

    effect(() => {
      const mode = this.visualizationMode$();
      const progressStates = this.progressStates$();

      if (!this.renderer) return;

      this.renderer.updateNodeStyles(mode, progressStates);
    });

    effect(() => {
      const progressStates = this.progressStates$();
      const previous = this.lastProgressStates;
      this.lastProgressStates = progressStates;

      if (!previous) return;

      const graphData = this.graphData();
      for (const [conceptId, state] of progressStates) {
        if (previous.get(conceptId) === state) continue;
        const title = graphData?.nodes.get(conceptId)?.title ?? conceptId;
        this.progressAnnouncement.set(`${title} progress updated to ${PROGRESS_STATE_LABELS[state]}`);
      }
    });

    effect(() => {
      const activeFilters = this.activeFilters$();
      const progressStates = this.progressStates$();

      if (!this.renderer) return;

      this.renderer.applyFilters(activeFilters, progressStates);
    });
  }

  ngOnInit(): void {
    this.renderer = new D3ForceRenderer(
      this.svgElRef().nativeElement,
      (id) => this.nodeSelected.emit(id),
      (id) => this.assessmentRequested.emit(id),
    );
    this.renderer.updateNodeStyles(this.visualizationMode$(), this.progressStates$());
    this.renderer.applyFilters(this.activeFilters$(), this.progressStates$());

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
