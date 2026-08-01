import { ChangeDetectionStrategy, Component, OnInit, inject, computed, signal } from '@angular/core';
import { GraphViewportContainerComponent } from '../../containers/graph-viewport-container/graph-viewport-container.component';
import { GraphStateService } from '../../../services/graph-state.service';
import type { NodeType } from '../../../models/graph.models';

@Component({
  selector: 'app-wiki-graph-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GraphViewportContainerComponent],
  templateUrl: './wiki-graph-smart.component.html',
  styleUrl: './wiki-graph-smart.component.scss',
})
export class WikiGraphPageComponent implements OnInit {
  protected readonly graphState = inject(GraphStateService);
  protected readonly nodeTypes: NodeType[] = ['entity', 'concept', 'source'];
  protected readonly toolbarVisible = signal(true);

  protected readonly visibleNodeIds = computed(() =>
    new Set(this.graphState.visibleNodes().map(n => n.id))
  );

  protected readonly visibleEdgeCount = computed(() => {
    const ids = this.visibleNodeIds();
    return (this.graphState.graphData()?.edges ?? [])
      .filter(e => ids.has(e.sourceId) && ids.has(e.targetId)).length;
  });

  protected readonly allTags = () => this.graphState.graphData()?.allTags ?? [];

  ngOnInit(): void {
    this.graphState.loadGraph();
  }

  protected toggleType(type: NodeType): void {
    const active = this.graphState.activeTypeFilters().has(type);
    this.graphState.setTypeFilter(type, !active);
  }

  protected highlightOrphans(): void {
    const orphans = this.graphState.orphanNodes();
    if (orphans.length > 0) this.graphState.selectNode(orphans[0].id);
  }
}
