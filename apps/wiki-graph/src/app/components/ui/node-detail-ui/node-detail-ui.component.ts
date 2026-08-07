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
import type { ProgressState } from '../../../models/progress.models';
import { PROGRESS_STATE_LABELS } from '../../../models/progress.constants';

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

  progress = input<{ state: ProgressState; assessmentCount: number } | null>(null);
  closed = output<void>();

  protected readonly progressStateLabels = PROGRESS_STATE_LABELS;

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
