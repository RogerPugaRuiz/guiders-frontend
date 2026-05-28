import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { LeadContactService } from './lead-contact.service';
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

describe('LeadContactService', () => {
  let service: LeadContactService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment }
      ]
    });

    service = TestBed.inject(LeadContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save contact data', () => {
    const visitorId = 'visitor-123';
    const data = { name: 'John', email: 'john@example.com', phone: '+1234567890' };

    service.saveContactData(visitorId, data).subscribe();

    const req = httpMock.expectOne('https://test-api.com/leads/contact-data/visitor-123');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(data);
  });

  it('should get contact data', () => {
    const visitorId = 'visitor-123';

    service.getContactData(visitorId).subscribe();

    const req = httpMock.expectOne('https://test-api.com/leads/contact-data/visitor-123');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ name: 'John', email: 'john@example.com', phone: '+1234567890' });
  });
});