import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  AUTH_REPOSITORY_TOKEN,
  LOGIN_USE_CASE_TOKEN,
  LOGOUT_USE_CASE_TOKEN,
  GET_CURRENT_USER_USE_CASE_TOKEN,
  GET_SESSION_USE_CASE_TOKEN,
  IS_AUTHENTICATED_USE_CASE_TOKEN,
  VALIDATE_TOKEN_USE_CASE_TOKEN,
  REFRESH_TOKEN_USE_CASE_TOKEN
} from '../config/auth-config.providers';

// Mock para AuthService
@Injectable()
export class MockAuthService {
  login(credentials: any): Observable<any> {
    return of({ token: 'mock-token', user: { id: '1', username: 'test' } });
  }

  logout(): Observable<void> {
    return of();
  }

  getCurrentUser(): Observable<any> {
    return of({ id: '1', username: 'test' });
  }

  isAuthenticated(): Observable<boolean> {
    return of(true);
  }
}

// Mock para los tokens de DI
export const MOCK_AUTH_PROVIDERS = [
  // Mocks para use cases
  { provide: LOGIN_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({ token: 'mock-token' }) } },
  { provide: LOGOUT_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve() } },
  { provide: GET_CURRENT_USER_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({ id: '1' }) } },
  { provide: VALIDATE_TOKEN_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve(true) } },
  { provide: REFRESH_TOKEN_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({ token: 'new-token' }) } },
  { provide: IS_AUTHENTICATED_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve(true) } },
  { provide: GET_SESSION_USE_CASE_TOKEN, useValue: { execute: () => Promise.resolve({ token: 'session-token' }) } },
  
  // Mock para repository
  { provide: AUTH_REPOSITORY_TOKEN, useValue: { 
    login: () => Promise.resolve({ token: 'mock-token' }),
    logout: () => Promise.resolve(),
    getCurrentUser: () => Promise.resolve({ id: '1' }),
    isAuthenticated: () => Promise.resolve(true),
    validateToken: () => Promise.resolve(true),
    refreshToken: () => Promise.resolve({ token: 'new-token' }),
    getSession: () => Promise.resolve({ token: 'session-token' }),
    clearSession: () => Promise.resolve()
  }}
];
