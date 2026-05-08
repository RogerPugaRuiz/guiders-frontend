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
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { globalErrorInterceptor } from './global-error.interceptor';
import { SessionService } from './session.service';

describe('globalErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let sessionService: { clearCache: ReturnType<typeof vi.fn> };
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    sessionService = { clearCache: vi.fn() };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([globalErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: sessionService },
      ],
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('AC4: 401 calls clearCache() and navigates to /login', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await new Promise<void>((resolve) => {
      httpClient.get('/api/test').subscribe({
        complete: () => resolve(),
        // EMPTY completes without error — if error fires the test should fail
        error: () => {
          throw new Error('Expected observable to complete, not error');
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    expect(sessionService.clearCache).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('AC5: 500 logs to console and rethrows error', async () => {
    await new Promise<void>((resolve) => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Expected error, not next'); },
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(500);
          expect(consoleErrorSpy).toHaveBeenCalled();
          resolve();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  it('AC5: network error (status 0) logs and rethrows', async () => {
    await new Promise<void>((resolve) => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Expected error, not next'); },
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(0);
          expect(consoleErrorSpy).toHaveBeenCalled();
          resolve();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));
    });
  });

  it('other 4xx errors (403) are passed through without clearing session', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await new Promise<void>((resolve) => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Expected error, not next'); },
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(403);
          expect(sessionService.clearCache).not.toHaveBeenCalled();
          expect(navigateSpy).not.toHaveBeenCalled();
          resolve();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
