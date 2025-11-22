import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsActiveFilters } from './visitors-active-filters';

describe('VisitorsActiveFilters', () => {
  let component: VisitorsActiveFilters;
  let fixture: ComponentFixture<VisitorsActiveFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsActiveFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsActiveFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
