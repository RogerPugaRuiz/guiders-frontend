import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, DOCUMENT } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IframeInitService } from './iframe-init.service';
import { IFRAME_CONFIG_TOKEN } from '../theme/theme.token';
import { initializeIframeInit } from './iframe-init.initializer';
import type { IframeInitResult } from '@guiders-frontend/shared/types/iframe';
import { of, throwError } from 'rxjs';

const BASE_URL = 'https://bff.example.com';
const TOKEN = 'test-token-123';

function configureTestBed() {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: DOCUMENT, useValue: document },
      {
        provide: IFRAME_CONFIG_TOKEN,
        useValue: { token: TOKEN, tenantId: 'tenant-1', baseUrl: BASE_URL },
      },
      IframeInitService,
    ],
  });
}

describe('initializeIframeInit', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    configureTestBed();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
  });

  function createFactory() {
    return TestBed.runInInjectionContext(() => initializeIframeInit());
  }

  describe('factory behavior', () => {
    it('returns a function', () => {
      const factory = createFactory();
      expect(typeof factory).toBe('function');
    });

    it('calls IframeInitService.initialize() when executed', async () => {
      const service = TestBed.inject(IframeInitService);
      const initializeSpy = vi.spyOn(service, 'initialize').mockReturnValue(of({
        ok: true,
        response: {
          company: { id: 'c1', name: 'Test', subdomain: 'test', logo: { url: '', alt: '' }, supportEmail: '' },
          theme: null,
          features: {
            chatEnabled: true,
            escalationsEnabled: true,
            contactsEnabled: true,
            visitorsEnabled: true,
            inboxEnabled: true,
            fileAttachments: true,
            readReceipts: true,
            typingIndicators: true,
            aiSuggestions: true,
          },
          user: { id: 'u1', name: 'Test', role: 'operator', avatar: '', permissions: [] },
          config: { sessionTimeout: 3600, maxFileSize: 10000000, acceptedMimeTypes: [], maxAttachments: 5 },
          version: '1.0.0',
        },
      }));

      const factory = createFactory();
      await factory();

      expect(initializeSpy).toHaveBeenCalled();
    });

    it('logs success message when init succeeds', async () => {
      const successResult: IframeInitResult = {
        ok: true,
        response: {
          company: { id: 'c1', name: 'Test', subdomain: 'test', logo: { url: '', alt: '' }, supportEmail: '' },
          theme: null,
          features: {
            chatEnabled: true,
            escalationsEnabled: true,
            contactsEnabled: true,
            visitorsEnabled: true,
            inboxEnabled: true,
            fileAttachments: true,
            readReceipts: true,
            typingIndicators: true,
            aiSuggestions: true,
          },
          user: { id: 'u1', name: 'Test', role: 'operator', avatar: '', permissions: [] },
          config: { sessionTimeout: 3600, maxFileSize: 10000000, acceptedMimeTypes: [], maxAttachments: 5 },
          version: '1.0.0',
        },
      };

      const service = TestBed.inject(IframeInitService);
      vi.spyOn(service, 'initialize').mockReturnValue(of(successResult));

      const factory = createFactory();
      await factory();

      expect(consoleLogSpy).toHaveBeenCalledWith('[AppInitializer] ✅ Iframe inicializado correctamente');
    });

    it('logs warning when init returns error result', async () => {
      const errorResult: IframeInitResult = {
        ok: false,
        error: { reason: 'expired' },
      };

      const service = TestBed.inject(IframeInitService);
      vi.spyOn(service, 'initialize').mockReturnValue(of(errorResult));

      const factory = createFactory();
      await factory();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AppInitializer] ⚠️ Iframe init falló:',
        'expired'
      );
    });

    it('logs error when init throws', async () => {
      const service = TestBed.inject(IframeInitService);
      vi.spyOn(service, 'initialize').mockImplementation(() => throwError(() => new Error('network error')));

      const factory = createFactory();
      await factory();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AppInitializer] ❌ Error al inicializar iframe:',
        expect.any(Error)
      );
    });

    it('does not throw when init throws', async () => {
      const service = TestBed.inject(IframeInitService);
      vi.spyOn(service, 'initialize').mockImplementation(() => throwError(() => new Error('network error')));

      const factory = createFactory();
      await expect(factory()).resolves.not.toThrow();
    });

    it('does not throw when init returns error result', async () => {
      const errorResult: IframeInitResult = {
        ok: false,
        error: { reason: 'expired' },
      };

      const service = TestBed.inject(IframeInitService);
      vi.spyOn(service, 'initialize').mockReturnValue(of(errorResult));

      const factory = createFactory();
      await expect(factory()).resolves.not.toThrow();
    });
  });
});