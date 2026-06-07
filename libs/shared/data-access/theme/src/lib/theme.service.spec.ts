import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, DOCUMENT } from '@angular/core';
import { ThemeService } from './theme.service';
import { TENANT_CONTEXT_TOKEN } from './tenant-context.token';

const LEGACY_KEY = 'guiders-sidebar-theme';

function getStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key: string, value: string | null): void {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}

function configureTestBed(tenantId: string | null): void {
  const providers: Array<unknown> = [
    { provide: PLATFORM_ID, useValue: 'browser' },
    { provide: DOCUMENT, useValue: document },
  ];
  if (tenantId !== undefined) {
    providers.push({ provide: TENANT_CONTEXT_TOKEN, useValue: tenantId });
  }
  TestBed.configureTestingModule({
    providers: [...providers, ThemeService],
  });
}

describe('ThemeService — multi-tenant localStorage isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('default mode (no tenantId)', () => {
    beforeEach(() => configureTestBed(null));

    it('uses the legacy global key when tenantId is null', () => {
      const service = TestBed.inject(ThemeService);
      service.setTheme('carbon');
      expect(getStoredValue(LEGACY_KEY)).toBe('carbon');
    });

    it('loads the saved theme from the legacy key on init', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('midnight');
    });

    it('returns DEFAULT_THEME when no value is stored', () => {
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('grey-dark');
    });

    it('round-trips setTheme → fresh service instance', () => {
      const first = TestBed.inject(ThemeService);
      first.setTheme('fresh-light');
      TestBed.resetTestingModule();
      configureTestBed(null);
      const second = TestBed.inject(ThemeService);
      expect(second.theme()).toBe('fresh-light');
    });
  });

  describe('tenant-scoped mode (with tenantId)', () => {
    it('stores theme under guiders-sidebar-theme-${tenantId}', () => {
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      service.setTheme('midnight');

      expect(getStoredValue('guiders-sidebar-theme-leadcars')).toBe('midnight');
      expect(getStoredValue(LEGACY_KEY)).toBeNull();
    });

    it('loads the saved theme from the tenant-scoped key on init', () => {
      setStoredValue('guiders-sidebar-theme-leadcars', 'warm-dark');
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('warm-dark');
    });

    it('isolates two tenants: tenant-a setting does not affect tenant-b', () => {
      configureTestBed('tenant-a');
      const serviceA = TestBed.inject(ThemeService);
      serviceA.setTheme('carbon');
      TestBed.resetTestingModule();

      configureTestBed('tenant-b');
      const serviceB = TestBed.inject(ThemeService);
      expect(serviceB.theme()).toBe('grey-dark');

      serviceB.setTheme('rose-quartz');
      TestBed.resetTestingModule();

      configureTestBed('tenant-a');
      const serviceAAgain = TestBed.inject(ThemeService);
      expect(serviceAAgain.theme()).toBe('carbon');

      expect(getStoredValue('guiders-sidebar-theme-tenant-a')).toBe('carbon');
      expect(getStoredValue('guiders-sidebar-theme-tenant-b')).toBe('rose-quartz');
    });

    it('returns DEFAULT_THEME when no value is stored for the tenant', () => {
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('grey-dark');
    });

    it('round-trips setTheme → fresh service instance for the same tenant', () => {
      configureTestBed('leadcars');
      const first = TestBed.inject(ThemeService);
      first.setTheme('fresh-light');
      TestBed.resetTestingModule();
      configureTestBed('leadcars');
      const second = TestBed.inject(ThemeService);
      expect(second.theme()).toBe('fresh-light');
    });

    it('treats empty-string tenantId as null (falls back to legacy key, isolation preserved)', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      configureTestBed('');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('midnight');
      // Should NOT have written a `guiders-sidebar-theme-` (empty suffix) key.
      expect(getStoredValue('guiders-sidebar-theme-')).toBeNull();
      // Writes go to the legacy key.
      service.setTheme('carbon');
      expect(getStoredValue(LEGACY_KEY)).toBe('carbon');
    });
  });

  describe('migration from legacy global key', () => {
    it('migrates legacy value to tenant-scoped key on first read (legacy preserved as fallback)', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('midnight');
      expect(getStoredValue('guiders-sidebar-theme-leadcars')).toBe('midnight');
      // Legacy key is intentionally NOT removed: it serves as the default
      // fallback for any other tenant that loads for the first time.
      expect(getStoredValue(LEGACY_KEY)).toBe('midnight');
    });

    it('normalises legacy aliases before persisting (dark → grey-dark)', () => {
      setStoredValue(LEGACY_KEY, 'dark');
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('grey-dark');
      expect(getStoredValue('guiders-sidebar-theme-leadcars')).toBe('grey-dark');
    });

    it('does not migrate when tenant-scoped key already has a value', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      setStoredValue('guiders-sidebar-theme-leadcars', 'carbon');
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('carbon');
      expect(getStoredValue(LEGACY_KEY)).toBe('midnight');
    });

    it('a second tenant inherits the legacy value on first load', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      configureTestBed('tenant-a');
      TestBed.inject(ThemeService);
      TestBed.resetTestingModule();

      configureTestBed('tenant-b');
      const serviceB = TestBed.inject(ThemeService);
      expect(serviceB.theme()).toBe('midnight');
      expect(getStoredValue('guiders-sidebar-theme-tenant-b')).toBe('midnight');
      // Legacy key still present for a third tenant.
      expect(getStoredValue(LEGACY_KEY)).toBe('midnight');
    });

    it('does not migrate when no legacy value exists', () => {
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      service.setTheme('midnight');
      expect(getStoredValue('guiders-sidebar-theme-leadcars')).toBe('midnight');
      expect(getStoredValue(LEGACY_KEY)).toBeNull();
    });

    it('does not run migration when tenantId is null (default mode)', () => {
      setStoredValue(LEGACY_KEY, 'midnight');
      configureTestBed(null);
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('midnight');
      expect(getStoredValue(LEGACY_KEY)).toBe('midnight');
    });
  });

  describe('SSR safety', () => {
    it('returns DEFAULT_THEME in non-browser platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DOCUMENT, useValue: document },
          { provide: TENANT_CONTEXT_TOKEN, useValue: 'leadcars' },
          ThemeService,
        ],
      });
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('grey-dark');
    });
  });

  describe('error handling', () => {
    it('falls back to DEFAULT_THEME when localStorage throws on read', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('storage unavailable');
        });
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('grey-dark');
      expect(warnSpy).toHaveBeenCalled();
      getItemSpy.mockRestore();
    });

    it('does not throw when localStorage write fails', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('quota exceeded');
        });
      configureTestBed('leadcars');
      const service = TestBed.inject(ThemeService);
      expect(() => service.setTheme('midnight')).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
    });
  });
});
