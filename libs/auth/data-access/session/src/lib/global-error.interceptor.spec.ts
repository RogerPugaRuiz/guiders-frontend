import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Environment } from '@guiders-frontend/shared/types';
import { globalErrorInterceptor } from './global-error.interceptor';
import { SessionService } from './session.service';
import { ENVIRONMENT_TOKEN } from './environment.token';

describe('globalErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let sessionService: { clearCache: ReturnType<typeof vi.fn> };
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const mockEnvironment: Environment = {
    production: false,
    auth: {
      authority: 'https://test.com',
      clientId: 'test-client',
      scope: 'openid',
      secureRoutes: [],
    },
    api: {
      baseUrl: 'https://test-api.com',
    },
  };

  beforeEach(async () => {
    sessionService = { clearCache: vi.fn() };
    // Suppress noisy interceptor logs and any jsdom "Not implemented: navigation"
    // errors that fire when the 401 branch calls location.replace().
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([globalErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: sessionService },
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
      ],
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('AC4: 401 clears session cache (BFF redirect side-effect)', async () => {
    await new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test').subscribe({
        // The interceptor swallows the 401 with EMPTY, so the stream completes.
        complete: () => resolve(),
        error: (err) =>
          reject(new Error(`Expected complete, got error: ${String(err)}`)),
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    // The interceptor must clear the session cache so cached User data is purged
    // before the BFF login redirect happens. The actual location.replace() call
    // is a side-effect against the global location object that jsdom can't
    // navigate; covered by E2E tests instead.
    expect(sessionService.clearCache).toHaveBeenCalledTimes(1);
  });

  it('AC5: 500 logs to console and rethrows error', async () => {
    await new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test').subscribe({
        next: () => reject(new Error('Expected error, not next')),
        error: (err: HttpErrorResponse) => {
          try {
            expect(err.status).toBe(500);
            expect(consoleErrorSpy).toHaveBeenCalled();
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  it('AC5: network error (status 0) logs and rethrows', async () => {
    await new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test').subscribe({
        next: () => reject(new Error('Expected error, not next')),
        error: (err: HttpErrorResponse) => {
          try {
            expect(err.status).toBe(0);
            expect(consoleErrorSpy).toHaveBeenCalled();
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));
    });
  });

  it('other 4xx errors (403) are passed through without clearing session', async () => {
    await new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test').subscribe({
        next: () => reject(new Error('Expected error, not next')),
        error: (err: HttpErrorResponse) => {
          try {
            expect(err.status).toBe(403);
            expect(sessionService.clearCache).not.toHaveBeenCalled();
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
