import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { TimeoutError } from 'rxjs';
import {
  Observable,
  of,
  throwError,
  timer,
} from 'rxjs';
import {
  catchError,
  map,
  tap,
  timeout,
  retry,
} from 'rxjs/operators';
import type {
  IframeInitResult,
  IframeInitResponse,
  IframeInitError,
} from '@guiders-frontend/shared/types/iframe';
import {
  PROTOCOL_VERSION,
} from '@guiders-frontend/shared/types/iframe';
import { IFRAME_CONFIG_TOKEN } from '../theme/theme.token';
import { ThemeService } from '../theme/theme.service';
import { DEFAULT_THEME } from '../theme/theme.fallback';
import { mapApiResponseToCanonical, mapApiErrorToCanonical, VersionError } from './api-mapper';

const INIT_REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += Math.floor(Math.random() * 16).toString(16);
  }
  return id;
}

@Injectable({ providedIn: 'root' })
export class IframeInitService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(IFRAME_CONFIG_TOKEN, { optional: true });
  private readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly _isLoading = signal(false);
  private readonly _currentResult = signal<IframeInitResult | null>(null);

  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly getCurrentResult: Signal<IframeInitResult | null> = this._currentResult.asReadonly();

  initialize(): Observable<IframeInitResult> {
    if (!this.isBrowser || !this.config) {
      const result: IframeInitResult = { ok: false, error: { reason: 'not_initialized' } };
      this._currentResult.set(result);
      return of(result);
    }

    if (this._isLoading()) {
      const current = this.getCurrentResult();
      return current !== null
        ? new Observable<IframeInitResult>(observer => {
            observer.next(current);
            observer.complete();
          })
        : of({ ok: false, error: { reason: 'not_initialized' } });
    }

    this._isLoading.set(true);

    const cfg = this.config;

    return this.fetchIframeInit(cfg).pipe(
      map(raw => this.processResponse(raw)),
      tap(result => {
        this._isLoading.set(false);
        this._currentResult.set(result);
        this.applyThemeFromResult(result);
      }),
      catchError(err => {
        this._isLoading.set(false);
        const errorResult: IframeInitResult = {
          ok: false,
          error: this.mapErrorToCanonical(err),
        };
        this._currentResult.set(errorResult);
        this.applyThemeFromResult(errorResult);
        return of(errorResult);
      }),
    );
  }

  retry(): Observable<IframeInitResult> {
    return this.initialize();
  }

  private fetchIframeInit(cfg: NonNullable<typeof this.config>): Observable<unknown> {
    return this.http.get<unknown>(this.buildUrl(cfg), {
      withCredentials: false,
      headers: this.buildHeaders(cfg),
    }).pipe(
      timeout(INIT_REQUEST_TIMEOUT_MS),
      retry({
        count: MAX_RETRY_ATTEMPTS,
        delay: (error: unknown, retryIndex: number) => {
          if (!this.shouldRetry(error)) {
            return throwError(() => error);
          }
          const backoff = this.getRetryDelay(error, retryIndex);
          return timer(backoff);
        },
      }),
    );
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return true;
      }
      if (error.status === 429) {
        return true;
      }
      if (error.status >= 500) {
        return true;
      }
      if (error.status === 401 || error.status === 408) {
        return false;
      }
      if (error.status >= 400 && error.status < 500) {
        return false;
      }
    }
    if (error instanceof TimeoutError) {
      return true;
    }
    return false;
  }

  private getRetryDelay(error: unknown, retryIndex: number): number {
    if (error instanceof HttpErrorResponse && error.status === 429) {
      const retryAfter = error.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
          return seconds * 1000;
        }
      }
    }
    return BASE_BACKOFF_MS * Math.pow(2, retryIndex);
  }

  private buildUrl(cfg: NonNullable<typeof this.config>): string {
    return `${cfg.baseUrl}/api/v1/iframe/init`;
  }

  private buildHeaders(cfg: NonNullable<typeof this.config>): Record<string, string> {
    return {
      Authorization: `Bearer ${cfg.token}`,
      'X-Iframe-Init-Version': PROTOCOL_VERSION,
      'X-Request-Id': generateRequestId(),
    };
  }

  private processResponse(raw: unknown): IframeInitResult {
    let response: IframeInitResponse;
    try {
      response = mapApiResponseToCanonical(raw);
    } catch (err) {
      if (err instanceof VersionError) {
        console.error(
          `IframeInitService: protocol version mismatch — receiver=${PROTOCOL_VERSION}, sender=${err.version}`,
        );
        return { ok: false, error: { reason: 'protocol_mismatch' } };
      }
      return { ok: false, error: { reason: 'invalid', message: 'Failed to parse API response' } };
    }

    return { ok: true, response };
  }

  private mapErrorToCanonical(err: unknown): IframeInitError {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return { reason: 'network_error' };
      }
      if (err.status === 401) {
        return mapApiErrorToCanonical(err.error);
      }
      if (err.status === 408) {
        return { reason: 'timeout' };
      }
      if (err.status === 429) {
        return mapApiErrorToCanonical(err.error);
      }
      if (err.status >= 500) {
        const canonical = mapApiErrorToCanonical(err.error);
        return { reason: canonical.reason ?? 'server_error', fallbackTheme: canonical.fallbackTheme };
      }
      return mapApiErrorToCanonical(err.error);
    }
    if (err instanceof TimeoutError) {
      return { reason: 'timeout' };
    }
    return { reason: 'network_error' };
  }

  private applyThemeFromResult(result: IframeInitResult): void {
    if (result.ok && result.response.theme) {
      this.themeService.setTheme(result.response.theme.config);
    } else {
      this.themeService.setTheme(DEFAULT_THEME);
    }
  }
}
