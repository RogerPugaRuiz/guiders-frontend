import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { EmbedModeService } from './embed-mode.service';

describe('EmbedModeService', () => {
  let service: EmbedModeService;

  beforeEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('standalone mode (default)', () => {
    it('debe retornar false cuando window.self === window.top (no iframe)', () => {
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(false);
    });

    it('debe retornar false cuando no hay query param', () => {
      stubDocument({ defaultView: makeDefaultWindow('') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(false);
    });
  });

  describe('iframe detection (window.self !== window.top)', () => {
    it('debe retornar true cuando window.self !== window.top (iframe)', () => {
      const mockWin = makeDefaultWindow('');
      (mockWin as Window & { self: unknown }).self = {} as Window;
      (mockWin as Window & { top: unknown }).top = { different: true } as Window;
      stubDocument({ defaultView: mockWin });

      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(true);
    });
  });

  describe('query param detection (?embed=true)', () => {
    it('debe retornar true cuando ?embed=true (incluso en standalone)', () => {
      stubDocument({ defaultView: makeDefaultWindow('?embed=true') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(true);
    });

    it('debe retornar false cuando ?embed=false', () => {
      stubDocument({ defaultView: makeDefaultWindow('?embed=false') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(false);
    });

    it('debe retornar false cuando ?embed=1 (debe ser exactamente "true")', () => {
      stubDocument({ defaultView: makeDefaultWindow('?embed=1') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(false);
    });

    it('debe retornar false cuando ?embed=TRUE (case-sensitive)', () => {
      stubDocument({ defaultView: makeDefaultWindow('?embed=TRUE') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(false);
    });

    it('debe parsear embed=true entre otros params', () => {
      stubDocument({ defaultView: makeDefaultWindow('?foo=bar&embed=true&baz=qux') });
      service = TestBed.inject(EmbedModeService);
      expect(service.isEmbed()).toBe(true);
    });
  });

  describe('caching behavior', () => {
    it('debe mantener el mismo valor entre llamadas (cached)', () => {
      stubDocument({ defaultView: makeDefaultWindow('?embed=true') });
      service = TestBed.inject(EmbedModeService);
      const first = service.isEmbed();
      const second = service.isEmbed();
      expect(first).toBe(second);
      expect(first).toBe(true);
    });
  });
});

/**
 * Stubs the Angular DOCUMENT token by replacing the internal window reference.
 * We use a plain object because the test environment doesn't allow redefining
 * jsdom's built-in `location` or `top` properties.
 */
function stubDocument(opts: { defaultView: Window }): void {
  // The service reads `document.defaultView` — patch it on the real document.
  // Since jsdom makes `defaultView` a getter, we need a different strategy.
  // Use Object.defineProperty to override the getter.
  const fakeWin = opts.defaultView;
  Object.defineProperty(window.document, 'defaultView', {
    value: fakeWin,
    writable: true,
    configurable: true,
  });
}

function makeDefaultWindow(search: string): Window {
  // Create a window-like object with the test's `search` value.
  // self and top point to this same object (so self === top → not iframe).
  return {
    location: { search } as Location,
  } as Window;
}