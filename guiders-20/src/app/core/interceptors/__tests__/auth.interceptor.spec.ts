import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../auth.interceptor';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import * as jwtUtils from '../../utils/jwt.utils';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: any;

  beforeEach(() => {
    const spy = {
      authToken: signal<string | null>(null),
      logout: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: spy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add auth header when token is available', () => {
    // Mock token
    authServiceSpy.authToken.set('test-token');

    // Mock isTokenExpired and isTokenNearExpiration to return false
    jest.spyOn(jwtUtils, 'isTokenExpired').mockReturnValue(false);
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(false);

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('******');
  });

  it('should not add auth header when no token is available', () => {
    // No token set
    authServiceSpy.authToken.set(null);

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('should skip auth for login endpoint', () => {
    authServiceSpy.authToken.set('test-token');

    httpClient.post('/api/auth/login', { email: 'test@example.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('should skip auth for register endpoint', () => {
    authServiceSpy.authToken.set('test-token');

    httpClient.post('/api/auth/register', { email: 'test@example.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('should handle expired token', () => {
    authServiceSpy.authToken.set('expired-token');
    authServiceSpy.logout.mockReturnValue(of(true));

    // Mock isTokenExpired to return true
    jest.spyOn(jwtUtils, 'isTokenExpired').mockReturnValue(true);

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(err.statusText).toBe('Token Expired');
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    httpMock.expectNone('/api/data'); // Request should not be made due to expired token
  });

  it('should warn about token near expiration', () => {
    authServiceSpy.authToken.set('expiring-token');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Mock isTokenExpired to return false and isTokenNearExpiration to return true
    jest.spyOn(jwtUtils, 'isTokenExpired').mockReturnValue(false);
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(true);

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Token próximo a expirar. En una implementación real, se refrescaría automáticamente.');
    
    consoleSpy.mockRestore();
  });

  it('should handle 401 error response', () => {
    authServiceSpy.authToken.set('test-token');
    authServiceSpy.logout.mockReturnValue(of(true));

    // Mock token utilities to return false (token is valid)
    jest.spyOn(jwtUtils, 'isTokenExpired').mockReturnValue(false);
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(false);

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 403 error response', () => {
    authServiceSpy.authToken.set('test-token');
    authServiceSpy.logout.mockReturnValue(of(true));

    // Mock token utilities to return false (token is valid)
    jest.spyOn(jwtUtils, 'isTokenExpired').mockReturnValue(false);
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(false);

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(403);
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 401 error when no token is available', () => {
    authServiceSpy.authToken.set(null);
    authServiceSpy.logout.mockReturnValue(of(true));

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.logout).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });
});
