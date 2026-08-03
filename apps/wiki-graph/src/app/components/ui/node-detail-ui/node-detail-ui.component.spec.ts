import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeDetailUiComponent } from './node-detail-ui.component';
import type { GraphNode } from '../../../models/graph.models';

function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: 'angular',
    title: 'Angular',
    type: 'entity',
    tags: [],
    filePath: 'entities/angular.md',
    isGhost: false,
    inDegree: 2,
    outDegree: 1,
    ...overrides,
  };
}

describe('NodeDetailUiComponent', () => {
  let fixture: ComponentFixture<NodeDetailUiComponent>;
  let component: NodeDetailUiComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeDetailUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeDetailUiComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when no node is selected', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.node-detail-panel')).toBeNull();
  });

  it('does not render progress info when progress input is null', () => {
    fixture.componentRef.setInput('node', makeNode());
    fixture.componentRef.setInput('progress', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.progress-badge')).toBeNull();
  });

  it('renders the progress state label and assessment count when progress is provided', () => {
    fixture.componentRef.setInput('node', makeNode());
    fixture.componentRef.setInput('progress', { state: 'Understood', assessmentCount: 3 });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.progress-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Understood');
    expect(badge.classList.contains('progress-Understood')).toBe(true);

    const dds = Array.from(fixture.nativeElement.querySelectorAll('dd')) as HTMLElement[];
    expect(dds.some((dd) => dd.textContent?.trim() === '3')).toBe(true);
  });

  it('emits closed when the close button is clicked', () => {
    fixture.componentRef.setInput('node', makeNode());
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => (closed = true));
    (fixture.nativeElement.querySelector('.close-btn') as HTMLButtonElement).click();

    expect(closed).toBe(true);
  });
});
