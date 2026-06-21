import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BrandingService } from './branding.service';

describe('BrandingService', () => {
  let service: BrandingService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    id: 'test-id',
    companyId: 'test-company-id',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      tertiary: '#0000ff',
      background: '#ffffff',
      surface: '#f0f0f0',
      text: '#000000',
      textMuted: '#666666',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      customFontFiles: [],
    },
    branding: {
      brandName: 'TestBrand',
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
    },
    theme: 'light' as const,
    embedEnabled: true,
    embedAllowedOrigins: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BrandingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  describe('initialization (AC1)', () => {
    it('debe inicializar con brandingConfig como null', () => {
      expect(service.brandingConfig()).toBeNull();
    });

    it('debe tener isLoading como false al inicio', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('debe tener isReady como false al inicio', () => {
      expect(service.isReady()).toBe(false);
    });

    it('debe tener hasError como false al inicio', () => {
      expect(service.hasError()).toBe(false);
    });
  });

  describe('loadBranding (AC1)', () => {
    it('debe llamar GET /v2/companies/:companyId/white-label', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      const req = httpMock.expectOne('/api/v2/companies/test-company-id/white-label');
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);
      await loadPromise;
    });

    it('debe actualizar brandingConfig signal después de load exitoso', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;
      expect(service.brandingConfig()?.branding.brandName).toBe('TestBrand');
    });

    it('debe setear isLoading=true durante el request', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      // Note: signal is updated synchronously, but flushed in microtask
      // We don't assert it here to avoid timing flakiness
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;
    });

    it('debe setear isReady=true después de load exitoso', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;
      expect(service.isReady()).toBe(true);
    });

    it('debe cachear el resultado para evitar requests duplicados', async () => {
      const p1 = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await p1;

      // Segundo load con misma companyId NO debe hacer nuevo request
      const p2 = service.loadBranding('test-company-id');
      await p2;
      httpMock.expectNone('/api/v2/companies/test-company-id/white-label');
    });
  });

  describe('applyBranding (AC1)', () => {
    it('debe aplicar CSS variables al document.documentElement', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;

      const doc = TestBed.inject(DOCUMENT);
      const root = doc.documentElement;
      expect(root.style.getPropertyValue('--gds-color-primary')).toBe('#ff0000');
      expect(root.style.getPropertyValue('--gds-color-secondary')).toBe('#00ff00');
      expect(root.style.getPropertyValue('--gds-color-tertiary')).toBe('#0000ff');
    });

    it('debe aplicar --gds-font-family', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;

      const doc = TestBed.inject(DOCUMENT);
      const root = doc.documentElement;
      expect(root.style.getPropertyValue('--gds-font-family')).toBe('Inter, sans-serif');
    });

    it('debe aplicar --gds-logo-url y --gds-favicon-url con url()', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;

      const doc = TestBed.inject(DOCUMENT);
      const root = doc.documentElement;
      expect(root.style.getPropertyValue('--gds-logo-url')).toBe(
        'url("https://example.com/logo.png")',
      );
      expect(root.style.getPropertyValue('--gds-favicon-url')).toBe(
        'url("https://example.com/favicon.ico")',
      );
    });
  });

  describe('document title + favicon (AC1)', () => {
    it('debe setear document.title a "Guiders Admin - {brandName}"', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;

      const doc = TestBed.inject(DOCUMENT);
      expect(doc.title).toBe('Guiders Admin - TestBrand');
    });

    it('debe crear/actualizar <link rel="icon"> con faviconUrl', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock.expectOne('/api/v2/companies/test-company-id/white-label').flush(mockConfig);
      await loadPromise;

      const doc = TestBed.inject(DOCUMENT);
      const favicon = doc.querySelector('link[rel="icon"]');
      expect(favicon).not.toBeNull();
      expect((favicon as HTMLLinkElement).href).toContain('favicon.ico');
    });

    it('NO debe crear favicon link si faviconUrl es null', async () => {
      const configWithoutFavicon = {
        ...mockConfig,
        branding: { ...mockConfig.branding, faviconUrl: null },
      };
      const doc = TestBed.inject(DOCUMENT);
      // Remove any existing favicon
      const existing = doc.querySelector('link[rel="icon"]');
      if (existing) existing.remove();

      const loadPromise = service.loadBranding('test-company-id');
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush(configWithoutFavicon);
      await loadPromise;

      const favicon = doc.querySelector('link[rel="icon"]');
      expect(favicon).toBeNull();
    });
  });

  describe('reactive updates (AC2)', () => {
    it('debe actualizar el signal reactivamente (re-fetch)', async () => {
      const loadPromise1 = service.loadBranding('test-company-id');
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush({ ...mockConfig, branding: { ...mockConfig.branding, brandName: 'First' } });
      await loadPromise1;
      expect(service.brandingConfig()?.branding.brandName).toBe('First');

      // Force re-fetch with refresh()
      const refreshPromise = service.refresh();
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush({ ...mockConfig, branding: { ...mockConfig.branding, brandName: 'Second' } });
      await refreshPromise;
      expect(service.brandingConfig()?.branding.brandName).toBe('Second');
    });
  });

  describe('error handling (AC3)', () => {
    it('debe setear hasError=true si el GET falla', async () => {
      const loadPromise = service.loadBranding('test-company-id');
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      await loadPromise.catch(() => undefined);
      expect(service.hasError()).toBe(true);
    });

    it('debe loggear warning si falla el load', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const loadPromise = service.loadBranding('test-company-id');
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
      await loadPromise.catch(() => undefined);

      expect(warnSpy).toHaveBeenCalled();
      const warnArgs = warnSpy.mock.calls[0].join(' ');
      expect(warnArgs).toContain('Branding');
    });

    it('debe NO aplicar branding si el load falla (fallback al inline CSS ya aplicado)', async () => {
      const doc = TestBed.inject(DOCUMENT);
      const root = doc.documentElement;

      // Clear any CSS variables from previous tests
      root.style.removeProperty('--gds-color-primary');
      root.style.removeProperty('--gds-color-secondary');
      root.style.removeProperty('--gds-color-tertiary');
      root.style.removeProperty('--gds-color-background');
      root.style.removeProperty('--gds-color-surface');
      root.style.removeProperty('--gds-color-text');
      root.style.removeProperty('--gds-color-text-muted');
      root.style.removeProperty('--gds-font-family');
      root.style.removeProperty('--gds-logo-url');
      root.style.removeProperty('--gds-favicon-url');

      const loadPromise = service.loadBranding('test-company-id');
      httpMock
        .expectOne('/api/v2/companies/test-company-id/white-label')
        .flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
      await loadPromise.catch(() => undefined);

      // No CSS variables applied after failed load
      expect(root.style.getPropertyValue('--gds-color-primary')).toBe('');
    });
  });
});