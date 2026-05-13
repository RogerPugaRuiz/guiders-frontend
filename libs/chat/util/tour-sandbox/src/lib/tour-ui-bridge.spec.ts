import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TourUiBridgeService } from './tour-ui-bridge';

/**
 * TourUiBridgeService is a thin signal-based bridge that lets the tour
 * lifecycle hook request UI state changes (e.g. open the visitor panel)
 * without the hook depending on feature components. Components like Inbox
 * read these signals via `effect()` and synchronise their local state.
 *
 * Contract: signals default to false; `requestOpenVisitorPanel(true)` flips
 * the signal so consumers react; `reset()` clears all flags so the next
 * tour run starts from a clean state.
 */
describe('TourUiBridgeService', () => {
  let service: TourUiBridgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TourUiBridgeService],
    });
    service = TestBed.inject(TourUiBridgeService);
  });

  describe('visitorPanelOpenRequested', () => {
    it('defaults to false', () => {
      expect(service.visitorPanelOpenRequested()).toBe(false);
    });

    it('flips to true when requestOpenVisitorPanel(true) is called', () => {
      service.requestOpenVisitorPanel(true);
      expect(service.visitorPanelOpenRequested()).toBe(true);
    });

    it('flips back to false when requestOpenVisitorPanel(false) is called', () => {
      service.requestOpenVisitorPanel(true);
      service.requestOpenVisitorPanel(false);
      expect(service.visitorPanelOpenRequested()).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all flags to false', () => {
      service.requestOpenVisitorPanel(true);
      service.reset();
      expect(service.visitorPanelOpenRequested()).toBe(false);
    });

    it('is safe to call when nothing was requested', () => {
      expect(() => service.reset()).not.toThrow();
      expect(service.visitorPanelOpenRequested()).toBe(false);
    });
  });
});
