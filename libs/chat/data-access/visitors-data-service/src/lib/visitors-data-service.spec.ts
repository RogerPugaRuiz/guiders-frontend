import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VisitorsDataService } from './visitors-data-service';

describe('VisitorsDataService', () => {
  let service: VisitorsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(VisitorsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});