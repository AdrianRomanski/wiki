import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  effect,
  viewChild,
} from '@angular/core';
import { GraphStateService } from '../../services/graph-state.service';

@Component({
  selector: 'app-node-detail-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'close()',
  },
  templateUrl: './node-detail-panel.component.html',
  styleUrl: './node-detail-panel.component.scss',
})
export class NodeDetailPanelComponent {
  private readonly graphState = inject(GraphStateService);
  protected readonly selectedNode = this.graphState.selectedNode;

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      const node = this.selectedNode();
      if (node) {
        setTimeout(() => this.panelRef()?.nativeElement.focus(), 0);
      }
    });
  }

  protected close(): void {
    this.graphState.selectNode(null);
  }
}
