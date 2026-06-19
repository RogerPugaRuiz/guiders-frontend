import 'zone.js';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { EmbedAllowedOriginsService } from './embed-allowed-origins.service';

describe('EmbedAllowedOriginsService', () => {
  let service: EmbedAllowedOriginsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmbedAllowedOriginsService);
  });

  it('debe crear servicio con lista vacía por defecto', () => {
    expect(service.isAllowed('https://leadcars.com')).toBe(false);
  });

  it('debe aceptar un origin válido después de setAllowed()', () => {
    service.setAllowed(['https://leadcars.com']);
    expect(service.isAllowed('https://leadcars.com')).toBe(true);
  });

  it('debe rechazar un origin no permitido', () => {
    service.setAllowed(['https://leadcars.com']);
    expect(service.isAllowed('https://attacker.com')).toBe(false);
  });

  it('debe rechazar un origin con subdomain diferente (strict match)', () => {
    service.setAllowed(['https://leadcars.com']);
    expect(service.isAllowed('https://evil.leadcars.com')).toBe(false);
  });

  it('debe rechazar origin con path (no debe aceptar URLs completas)', () => {
    service.setAllowed(['https://leadcars.com']);
    expect(service.isAllowed('https://leadcars.com/dashboard')).toBe(false);
  });

  it('debe rechazar origin null/undefined/empty', () => {
    service.setAllowed(['https://leadcars.com']);
    expect(service.isAllowed('')).toBe(false);
    // @ts-expect-error testing invalid input
    expect(service.isAllowed(null)).toBe(false);
    // @ts-expect-error testing invalid input
    expect(service.isAllowed(undefined)).toBe(false);
  });
});