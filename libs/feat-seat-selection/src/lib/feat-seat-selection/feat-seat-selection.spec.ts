import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatSeatSelection } from './feat-seat-selection';

describe('FeatSeatSelection', () => {
  let component: FeatSeatSelection;
  let fixture: ComponentFixture<FeatSeatSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatSeatSelection],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatSeatSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
