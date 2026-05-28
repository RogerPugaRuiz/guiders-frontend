import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VisitorsDataService } from './visitors-data-service';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { Environment } from '@guiders-frontend/shared/types';

const mockEnvironment: Environment = {
  production: false,
  auth: {
    authority: 'https://test.com',
    clientId: 'test-client',
    scope: 'openid',
    secureRoutes: []
  },
  api: {
    baseUrl: 'https://test-api.com'
  }
};

describe('VisitorsDataService', () => {
  let service: VisitorsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment }
      ]
    });
    service = TestBed.inject(VisitorsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});