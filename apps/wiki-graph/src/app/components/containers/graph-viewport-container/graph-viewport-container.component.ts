import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GraphCanvasComponent } from '../../ui/graph-canvas/graph-canvas.component';
import { GraphToolbarUiComponent } from '../../ui/graph-toolbar-ui/graph-toolbar-ui.component';
import { NodeDetailUiComponent } from '../../ui/node-detail-ui/node-detail-ui.component';
import type { GraphData, GraphNode, NodeType } from '../../../models/graph.models';

@Component({
  selector: 'app-graph-viewport-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GraphCanvasComponent, GraphToolbarUiComponent, NodeDetailUiComponent],
  templateUrl: './graph-viewport-container.component.html',
  styleUrl: './graph-viewport-container.component.scss',
})
export class GraphViewportContainerComponent {
  graphData = input<GraphData | null>(null);
  visibleNodeIds = input<Set<string>>(new Set());
  selectedNode = input<GraphNode | null>(null);
  nodeTypes = input<NodeType[]>(['entity', 'concept', 'source']);
  activeTypeFilters = input<Set<NodeType>>(new Set());
  searchQuery = input<string>('');
  activeTagFilter = input<string | null>(null);
  allTags = input<string[]>([]);
  visibleNodeCount = input<number>(0);
  visibleEdgeCount = input<number>(0);
  orphanCount = input<number>(0);
  hubNodes = input<GraphNode[]>([]);
  toolbarVisible = input<boolean>(true);
  isLoading = input<boolean>(false);
  error = input<string | null>(null);

  nodeSelected = output<string | null>();
  typeToggled = output<NodeType>();
  searchChanged = output<string>();
  tagChanged = output<string | null>();
  orphanHighlighted = output<void>();
  hubSelected = output<string>();
  refreshRequested = output<void>();
  toolbarVisibilityToggled = output<boolean>();
  detailClosed = output<void>();
}
