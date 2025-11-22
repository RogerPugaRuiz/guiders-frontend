import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsQuickFilters } from './visitors-quick-filters';

describe('VisitorsQuickFilters', () => {
  let component: VisitorsQuickFilters;
  let fixture: ComponentFixture<VisitorsQuickFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsQuickFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsQuickFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
