import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { Visitor } from '@guiders-frontend/types';
import {
  DEMO_VISITOR_ID,
  TourSandboxService,
  isDemoId,
} from './tour-sandbox';

describe('TourSandboxService', () => {
  let service: TourSandboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TourSandboxService],
    });
    service = TestBed.inject(TourSandboxService);
  });

  describe('initial state', () => {
    it('starts inactive', () => {
      expect(service.isActive()).toBe(false);
    });

    it('emits empty visitors array before activate()', async () => {
      const visitors = await firstValueFrom(service.visitors$);
      expect(visitors).toEqual([]);
    });
  });

  describe('activate()', () => {
    beforeEach(() => service.activate());

    it('flips isActive to true', () => {
      expect(service.isActive()).toBe(true);
    });

    it('emits one demo visitor with the agreed identity', async () => {
      const visitors = await firstValueFrom(service.visitors$);
      expect(visitors).toHaveLength(1);
      const v: Visitor = visitors[0];
      expect(v.id).toBe(DEMO_VISITOR_ID);
      expect(v.name).toBe('María García (DEMO)');
      expect(v.email).toBe('maria.garcia@demo.guiders.es');
    });

    it('is idempotent: calling activate() twice does not duplicate visitors', async () => {
      service.activate();
      const visitors = await firstValueFrom(service.visitors$);
      expect(visitors).toHaveLength(1);
    });

    it('exposes a synchronous visitorsSnapshot', () => {
      expect(service.visitorsSnapshot).toHaveLength(1);
      expect(service.visitorsSnapshot[0].id).toBe(DEMO_VISITOR_ID);
    });
  });

  describe('deactivate()', () => {
    it('flips isActive back to false and clears visitors', async () => {
      service.activate();
      service.deactivate();
      expect(service.isActive()).toBe(false);
      expect(await firstValueFrom(service.visitors$)).toEqual([]);
    });

    it('is safe to call when already inactive', () => {
      expect(() => service.deactivate()).not.toThrow();
      expect(service.isActive()).toBe(false);
    });
  });

  describe('isDemoId()', () => {
    it('returns true for ids starting with the tour-demo- prefix', () => {
      expect(isDemoId(DEMO_VISITOR_ID)).toBe(true);
      expect(isDemoId('tour-demo-anything')).toBe(true);
    });

    it('returns false for any other id', () => {
      expect(isDemoId('visitor-1')).toBe(false);
      expect(isDemoId('self-user-1')).toBe(false);
      expect(isDemoId('')).toBe(false);
    });
  });
});
