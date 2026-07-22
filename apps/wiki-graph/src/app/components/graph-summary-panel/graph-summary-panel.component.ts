import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GraphStateService } from '../../services/graph-state.service';

@Component({
  selector: 'app-graph-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-summary-panel.component.html',
  styleUrl: './graph-summary-panel.component.scss',
})
export class GraphSummaryPanelComponent {
  protected readonly graphState = inject(GraphStateService);

  protected readonly graphData = this.graphState.graphData;
  protected readonly hubNodes = this.graphState.hubNodes;
  protected readonly orphanNodes = this.graphState.orphanNodes;

  protected highlightOrphans(): void {
    const orphans = this.orphanNodes();
    if (orphans.length > 0) {
      this.graphState.selectNode(orphans[0].id);
    }
  }
}
