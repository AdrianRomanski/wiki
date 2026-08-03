import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphViewportContainerComponent } from './graph-viewport-container.component';
import type { GraphData, GraphNode } from '../../../models/graph.models';
import type { ProgressState } from '../../../models/progress.models';

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    title: id,
    type: 'entity',
    tags: [],
    filePath: `entities/${id}.md`,
    isGhost: false,
    inDegree: 0,
    outDegree: 0,
    ...overrides,
  };
}

function makeGraphData(nodes: GraphNode[]): GraphData {
  return { nodes: new Map(nodes.map((n) => [n.id, n])), edges: [], allTags: [] };
}

describe('GraphViewportContainerComponent', () => {
  let fixture: ComponentFixture<GraphViewportContainerComponent>;
  let component: GraphViewportContainerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphViewportContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphViewportContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults visualizationMode to "wiki" and progress inputs to empty', () => {
    fixture.detectChanges();
    expect(component.visualizationMode()).toBe('wiki');
    expect(component.progressStates().size).toBe(0);
    expect(component.activeProgressFilters()).toEqual([]);
    expect(component.selectedNodeProgress()).toBeNull();
  });

  it('forwards progress states to the graph canvas', () => {
    const progressStates = new Map<string, ProgressState>([['angular', 'Mastered']]);
    fixture.componentRef.setInput('graphData', makeGraphData([makeNode('angular')]));
    fixture.componentRef.setInput('progressStates', progressStates);
    fixture.componentRef.setInput('visualizationMode', 'progress');
    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('app-graph-canvas');
    expect(canvas).toBeTruthy();
  });

  it('forwards the selected node progress to node-detail-ui', () => {
    fixture.componentRef.setInput('selectedNode', makeNode('angular'));
    fixture.componentRef.setInput('selectedNodeProgress', {
      state: 'Understood',
      assessmentCount: 2,
    });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.progress-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Understood');
  });

  it('re-emits assessmentRequested events bubbled up from the canvas', () => {
    fixture.detectChanges();

    let emitted: string | undefined;
    component.assessmentRequested.subscribe((id) => (emitted = id));
    component.assessmentRequested.emit('angular');

    expect(emitted).toBe('angular');
  });
});
