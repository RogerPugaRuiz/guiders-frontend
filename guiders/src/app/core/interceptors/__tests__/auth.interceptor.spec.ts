import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthInterceptor } from '../auth.interceptor';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import * as jwtUtils from '../../utils/jwt.utils';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: any;

  beforeEach(() => {
    const spy = {
      getSession: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: spy },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add auth header when session is available', () => {
    // Mock session
    authServiceSpy.getSession.mockReturnValue(of({
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour in the future
      user: { id: '1', email: 'test@example.com' } as any
    }));

    // Mock isTokenNearExpiration to return false
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(false);

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('******');
  });

  it('should refresh token when token is near expiration', () => {
    // Mock session with a token that's about to expire
    authServiceSpy.getSession.mockReturnValue(of({
      token: 'expiring-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 60000), // 1 minute in the future
      user: { id: '1', email: 'test@example.com' } as any
    }));

    // Mock refreshToken to return a new session
    authServiceSpy.refreshToken.mockReturnValue(of({
      token: 'new-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour in the future
      user: { id: '1', email: 'test@example.com' } as any
    }));

    // Mock isTokenNearExpiration to return true
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(true);

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('******');
    expect(authServiceSpy.refreshToken).toHaveBeenCalled();
  });

  it('should handle error when token refresh fails', () => {
    // Mock session with a token that's about to expire
    authServiceSpy.getSession.mockReturnValue(of({
      token: 'expiring-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 60000), // 1 minute in the future
      user: { id: '1', email: 'test@example.com' } as any
    }));

    // Mock refreshToken to fail
    authServiceSpy.refreshToken.mockReturnValue(throwError(() => ({ status: 401 })));
    authServiceSpy.logout.mockReturnValue(of(undefined));

    // Mock isTokenNearExpiration to return true
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(true);

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    httpMock.expectNone('/api/data'); // Request should not be made due to refresh failure
  });
});