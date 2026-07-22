import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { NodeType } from '../../models/graph.models';
import { GraphStateService } from '../../services/graph-state.service';

@Component({
  selector: 'app-graph-controls',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-controls.component.html',
  styleUrl: './graph-controls.component.scss',
})
export class GraphControlsComponent {
  protected readonly graphState = inject(GraphStateService);

  protected readonly nodeTypes: NodeType[] = ['entity', 'concept', 'source'];

  protected readonly activeTypeFilters = this.graphState.activeTypeFilters;
  protected readonly searchQuery = this.graphState.searchQuery;
  protected readonly activeTagFilter = this.graphState.activeTagFilter;

  protected readonly allTags = () => this.graphState.graphData()?.allTags ?? [];

  protected toggleType(type: NodeType): void {
    const isActive = this.activeTypeFilters().has(type);
    this.graphState.setTypeFilter(type, !isActive);
  }

  protected onSearch(event: Event): void {
    this.graphState.setSearchQuery((event.target as HTMLInputElement).value);
  }

  protected onTagChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.graphState.setTagFilter(value || null);
  }
}
