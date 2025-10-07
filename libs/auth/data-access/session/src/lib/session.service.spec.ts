import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SessionService, User } from './session.service';
import { ENVIRONMENT_TOKEN } from './environment.token';
import { Environment } from '@guiders-frontend/shared/types';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment }
      ]
    });
    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user session', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    service.ensureSession$().subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('https://test-api.com/auth/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockUser);
  });

  it('should cache the session request', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    // Primera llamada
    service.ensureSession$().subscribe();
    // Segunda llamada
    service.ensureSession$().subscribe();

    // Solo debe hacer una petición HTTP
    const req = httpMock.expectOne('https://test-api.com/auth/me');
    req.flush(mockUser);
  });

  it('should clear cache', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    // Primera llamada
    service.ensureSession$().subscribe();
    const req1 = httpMock.expectOne('https://test-api.com/auth/me');
    req1.flush(mockUser);

    // Limpiar cache
    service.clearCache();

    // Segunda llamada después de limpiar cache
    service.ensureSession$().subscribe();
    const req2 = httpMock.expectOne('https://test-api.com/auth/me');
    req2.flush(mockUser);
  });
});
