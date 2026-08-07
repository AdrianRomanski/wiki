import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GraphNode, NodeType } from '../../../models/graph.models';
import type { VisualizationMode } from '../../../models/progress.constants';

@Component({
  selector: 'app-graph-toolbar-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-toolbar-ui.component.html',
  styleUrl: './graph-toolbar-ui.component.scss',
})
export class GraphToolbarUiComponent {
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

  visualizationMode = input<VisualizationMode>('wiki');

  typeToggled = output<NodeType>();
  searchChanged = output<string>();
  tagChanged = output<string | null>();
  orphanHighlighted = output<void>();
  hubSelected = output<string>();
  refreshRequested = output<void>();
  toolbarVisibilityToggled = output<boolean>();

  visualizationModeChanged = output<VisualizationMode>();

  protected toggleVisualizationMode(): void {
    const next: VisualizationMode = this.visualizationMode() === 'wiki' ? 'progress' : 'wiki';
    this.visualizationModeChanged.emit(next);
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChanged.emit(value);
  }

  protected onTagSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.tagChanged.emit(value || null);
  }
}
