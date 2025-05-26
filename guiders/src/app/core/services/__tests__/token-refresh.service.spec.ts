import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TokenRefreshService } from '../token-refresh.service';
import { AuthService } from '../auth.service';
import { of, throwError } from 'rxjs';
import * as jwtUtils from '../../utils/jwt.utils';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let authServiceSpy: jest.Mocked<AuthService>;

  beforeEach(() => {
    // Mock para el AuthService
    const authSpy = {
      getSession: jest.fn().mockReturnValue(of({
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hora en el futuro
        user: { id: '1', email: 'test@example.com' } as any
      })),
      refreshToken: jest.fn().mockReturnValue(of({
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 7200000), // 2 horas en el futuro
        user: { id: '1', email: 'test@example.com' } as any
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        TokenRefreshService,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(TokenRefreshService);
    authServiceSpy = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should refresh token when token is near expiration', fakeAsync(() => {
    // Mock isTokenNearExpiration para que devuelva true
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(true);

    // Inicializar el servicio
    service.initialize();

    // Avanzar el tiempo para que se ejecute la comprobación
    tick(60000); // 1 minuto

    // Verificar que se ha llamado a refreshToken
    expect(authServiceSpy.refreshToken).toHaveBeenCalled();

    // Cleanup
    (service as any).ngOnDestroy();
  }));

  it('should not refresh token when token is not near expiration', fakeAsync(() => {
    // Mock isTokenNearExpiration para que devuelva false
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(false);

    // Inicializar el servicio
    service.initialize();

    // Avanzar el tiempo para que se ejecute la comprobación
    tick(60000); // 1 minuto

    // Verificar que NO se ha llamado a refreshToken
    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();

    // Cleanup
    (service as any).ngOnDestroy();
  }));

  it('should handle errors when refreshing token', fakeAsync(() => {
    // Mock isTokenNearExpiration para que devuelva true
    jest.spyOn(jwtUtils, 'isTokenNearExpiration').mockReturnValue(true);
    
    // Mock refreshToken para que falle
    authServiceSpy.refreshToken.mockReturnValue(throwError(() => new Error('Error refreshing token')));
    
    // Espiar el console.error
    const consoleSpy = jest.spyOn(console, 'error');
    
    // Inicializar el servicio
    service.initialize();

    // Avanzar el tiempo para que se ejecute la comprobación
    tick(60000); // 1 minuto

    // Verificar que se ha llamado a refreshToken y que se ha registrado el error
    expect(authServiceSpy.refreshToken).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error al refrescar el token:', expect.any(Error));

    // Cleanup
    (service as any).ngOnDestroy();
    consoleSpy.mockRestore();
  }));
});
