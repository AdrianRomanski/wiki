import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { GraphNode } from '../../../models/graph.models';

@Component({
  selector: 'app-node-detail-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'closed.emit()',
  },
  templateUrl: './node-detail-ui.component.html',
  styleUrl: './node-detail-ui.component.scss',
})
export class NodeDetailUiComponent {
  node = input<GraphNode | null>(null);
  closed = output<void>();

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      const selected = this.node();
      if (selected) {
        setTimeout(() => this.panelRef()?.nativeElement.focus(), 0);
      }
    });
  }
}
