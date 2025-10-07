import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { vi, Mock } from 'vitest';
import { of, throwError } from 'rxjs';
import { SessionService } from '@guiders-frontend/auth/data-access/session';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockSessionService: {
    ensureSession$: Mock;
  };
  
  let mockRouter: {
    navigate: Mock;
  };

  beforeEach(() => {
    mockSessionService = {
      ensureSession$: vi.fn()
    };
    
    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow access when user session is valid', (done) => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    mockSessionService.ensureSession$.mockReturnValue(of(mockUser));

    const result = executeGuard({} as never, {} as never);
    
    if (typeof result === 'object' && 'subscribe' in result) {
      result.subscribe(canActivate => {
        expect(canActivate).toBe(true);
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    }
  });

  it('should deny access and redirect to login when session fails', (done) => {
    mockSessionService.ensureSession$.mockReturnValue(throwError(() => new Error('Unauthorized')));

    const result = executeGuard({} as never, {} as never);
    
    if (typeof result === 'object' && 'subscribe' in result) {
      result.subscribe(canActivate => {
        expect(canActivate).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    }
  });
});
