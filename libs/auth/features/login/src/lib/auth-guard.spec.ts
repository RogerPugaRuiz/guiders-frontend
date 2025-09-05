import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { vi, Mock } from 'vitest';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockOidcSecurityService: {
    authorize: Mock;
  };

  beforeEach(() => {
    mockOidcSecurityService = {
      authorize: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: OidcSecurityService, useValue: mockOidcSecurityService }
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow access when access-token exists in localStorage', () => {
    localStorage.setItem('access-token', 'fake-token');

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(true);
    expect(mockOidcSecurityService.authorize).not.toHaveBeenCalled();
  });

  it('should call OIDC authorize and deny access when access-token does not exist in localStorage', () => {
    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(false);
    expect(mockOidcSecurityService.authorize).toHaveBeenCalled();
  });
});
