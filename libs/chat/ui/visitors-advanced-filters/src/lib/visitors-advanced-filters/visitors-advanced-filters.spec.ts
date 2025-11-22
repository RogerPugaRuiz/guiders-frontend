import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsAdvancedFilters } from './visitors-advanced-filters';

describe('VisitorsAdvancedFilters', () => {
  let component: VisitorsAdvancedFilters;
  let fixture: ComponentFixture<VisitorsAdvancedFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsAdvancedFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsAdvancedFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
