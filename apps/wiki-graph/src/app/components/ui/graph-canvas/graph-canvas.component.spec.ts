import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphCanvasComponent } from './graph-canvas.component';
import type { GraphData, GraphNode } from '../../../models/graph.models';
import type { ProgressState } from '../../../models/progress.models';
import { PROGRESS_COLORS, WIKI_NODE_COLORS } from '../../../models/progress.constants';

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

describe('GraphCanvasComponent', () => {
  let fixture: ComponentFixture<GraphCanvasComponent>;
  let component: GraphCanvasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphCanvasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('defaults visualizationMode$ to "wiki" and progressStates$/activeFilters$ to empty', () => {
    fixture.detectChanges();
    expect(component.visualizationMode$()).toBe('wiki');
    expect(component.progressStates$().size).toBe(0);
    expect(component.activeFilters$()).toEqual([]);
  });

  it('renders nodes colored by wiki type when visualizationMode$ is "wiki"', () => {
    const data = makeGraphData([makeNode('a', { type: 'concept' })]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('visualizationMode$', 'wiki');
    fixture.detectChanges();

    const circle = fixture.nativeElement.querySelector('g.node circle') as SVGCircleElement;
    expect(circle.getAttribute('fill')).toBe(WIKI_NODE_COLORS.concept);
  });

  it('renders nodes colored by progress state when visualizationMode$ is "progress"', () => {
    const data = makeGraphData([makeNode('a')]);
    const progressStates = new Map<string, ProgressState>([['a', 'Mastered']]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('visualizationMode$', 'progress');
    fixture.componentRef.setInput('progressStates$', progressStates);
    fixture.detectChanges();

    const circle = fixture.nativeElement.querySelector('g.node circle') as SVGCircleElement;
    expect(circle.getAttribute('fill')).toBe(PROGRESS_COLORS.Mastered);
  });

  it('recolors nodes when visualizationMode$ changes after initial render', () => {
    const data = makeGraphData([makeNode('a')]);
    const progressStates = new Map<string, ProgressState>([['a', 'In_Progress']]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('progressStates$', progressStates);
    fixture.detectChanges();

    let circle = fixture.nativeElement.querySelector('g.node circle') as SVGCircleElement;
    expect(circle.getAttribute('fill')).toBe(WIKI_NODE_COLORS.entity);

    fixture.componentRef.setInput('visualizationMode$', 'progress');
    fixture.detectChanges();

    circle = fixture.nativeElement.querySelector('g.node circle') as SVGCircleElement;
    expect(circle.getAttribute('fill')).toBe(PROGRESS_COLORS.In_Progress);
  });

  it('exposes an assessmentRequested output emitter', () => {
    fixture.detectChanges();
    let emitted: string | undefined;
    component.assessmentRequested.subscribe((id) => (emitted = id));
    component.assessmentRequested.emit('concept-a');
    expect(emitted).toBe('concept-a');
  });

  it('hides nodes not matching the active progress filter', () => {
    const data = makeGraphData([makeNode('a'), makeNode('b')]);
    const progressStates = new Map<string, ProgressState>([
      ['a', 'Mastered'],
      ['b', 'Not_Started'],
    ]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('progressStates$', progressStates);
    fixture.componentRef.setInput('activeFilters$', ['Mastered']);
    fixture.detectChanges();

    const nodeEls = fixture.nativeElement.querySelectorAll('g.node') as NodeListOf<SVGGElement>;
    const displays = Array.from(nodeEls).map((el) => el.style.display);
    expect(displays).toEqual(['', 'none']);
  });

  it('re-applies filters when activeFilters$ changes after initial render', () => {
    const data = makeGraphData([makeNode('a'), makeNode('b')]);
    const progressStates = new Map<string, ProgressState>([
      ['a', 'Mastered'],
      ['b', 'Not_Started'],
    ]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('progressStates$', progressStates);
    fixture.detectChanges();

    let nodeEls = fixture.nativeElement.querySelectorAll('g.node') as NodeListOf<SVGGElement>;
    expect(Array.from(nodeEls).map((el) => el.style.display)).toEqual(['', '']);

    fixture.componentRef.setInput('activeFilters$', ['Not_Started']);
    fixture.detectChanges();

    nodeEls = fixture.nativeElement.querySelectorAll('g.node') as NodeListOf<SVGGElement>;
    expect(Array.from(nodeEls).map((el) => el.style.display)).toEqual(['none', '']);
  });

  it('emits assessmentRequested with the node id when Enter is pressed on a rendered node', () => {
    const data = makeGraphData([makeNode('a')]);
    fixture.componentRef.setInput('graphData', data);
    fixture.detectChanges();

    let emitted: string | undefined;
    component.assessmentRequested.subscribe((id) => (emitted = id));

    const nodeEl = fixture.nativeElement.querySelector('g.node') as SVGGElement;
    nodeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(emitted).toBe('a');
  });

  it('renders a visually-hidden ARIA live region for progress announcements', () => {
    fixture.detectChanges();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.getAttribute('role')).toBe('status');
  });

  it('announces a progress state change for the affected concept via the live region', () => {
    const data = makeGraphData([makeNode('a', { title: 'RxJS' })]);
    fixture.componentRef.setInput('graphData', data);
    fixture.componentRef.setInput('progressStates$', new Map<string, ProgressState>([['a', 'Not_Started']]));
    fixture.detectChanges();

    fixture.componentRef.setInput('progressStates$', new Map<string, ProgressState>([['a', 'Understood']]));
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toContain('RxJS progress updated to Understood');
  });

  it('does not announce anything when progressStates$ is unchanged', () => {
    const data = makeGraphData([makeNode('a', { title: 'RxJS' })]);
    fixture.componentRef.setInput('graphData', data);
    const progressStates = new Map<string, ProgressState>([['a', 'Not_Started']]);
    fixture.componentRef.setInput('progressStates$', progressStates);
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(liveRegion.textContent).toBe('');
  });
});
