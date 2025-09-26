import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { VisitorsComponent } from './visitors';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';

describe('VisitorsComponent', () => {
  let component: VisitorsComponent;
  let fixture: ComponentFixture<VisitorsComponent>;
  beforeEach(async () => {
    const mockVisitorsService = {
      getVisitors: vi.fn(() => of({ visitors: [], total: 0, hasMore: false })),
      getVisitorStats: vi.fn(() => of(null))
    };

    await TestBed.configureTestingModule({
      imports: [VisitorsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VisitorsDataService, useValue: mockVisitorsService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VisitorsComponent);
    component = fixture.componentInstance;
    // No llamamos fixture.detectChanges() para evitar ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
