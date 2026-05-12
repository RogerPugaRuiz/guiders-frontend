import { describe, it, expect } from 'vitest';
import { consoleTour } from './console.tour';
import { adminTour } from './admin.tour';

describe('consoleTour', () => {
  it('should have at least 8 steps', () => {
    expect(consoleTour.length).toBeGreaterThanOrEqual(8);
  });

  it('should have all steps with a non-empty element selector', () => {
    consoleTour.forEach((step, i) => {
      expect(step.element, `step ${i} element`).toBeTruthy();
      expect(step.element.startsWith('[data-tour=')).toBe(true);
    });
  });

  it('should have all steps with a popover title and description', () => {
    consoleTour.forEach((step, i) => {
      expect(step.popover.title, `step ${i} title`).toBeTruthy();
      expect(step.popover.description, `step ${i} description`).toBeTruthy();
    });
  });

  it('first step should navigate to /inbox', () => {
    expect(consoleTour[0].route).toBe('/inbox');
  });

  it('should include a step for visitors nav (highlighted from /inbox)', () => {
    // The new informational tour stays on /inbox the whole time and
    // simply points at the Visitantes sidebar entry rather than navigating.
    const hasVisitorsNavStep = consoleTour.some(
      (step) => step.element === '[data-tour="nav-visitors"]'
    );
    expect(hasVisitorsNavStep).toBe(true);
  });

  it('should include the sidebar-header step', () => {
    const hasSidebar = consoleTour.some(
      (step) => step.element === '[data-tour="sidebar-header"]'
    );
    expect(hasSidebar).toBe(true);
  });

  it('should be fully informational (no auto-advance action steps)', () => {
    // Decision: every step renders Prev/Next buttons; no step waits for the
    // user to perform a real DOM action to progress. This keeps the tour
    // resilient to DOM mutations and lets the user read at their own pace.
    const actionSteps = consoleTour.filter((step) => step.mode === 'action');
    expect(actionSteps.length).toBe(0);
  });

  it('should highlight the agent status selector', () => {
    const hasStatus = consoleTour.some(
      (step) => step.element === '[data-tour="status-trigger"]'
    );
    expect(hasStatus).toBe(true);
  });

  it('should highlight the message input', () => {
    const hasMsg = consoleTour.some(
      (step) => step.element === '[data-tour="message-input"]'
    );
    expect(hasMsg).toBe(true);
  });

  it('should highlight the visitor detail panel', () => {
    const hasPanel = consoleTour.some(
      (step) => step.element === '[data-tour="visitor-detail-panel"]'
    );
    expect(hasPanel).toBe(true);
  });

  it('should highlight the escalations nav entry', () => {
    const hasEscalations = consoleTour.some(
      (step) => step.element === '[data-tour="nav-escalations"]'
    );
    expect(hasEscalations).toBe(true);
  });

  it('should highlight the visitors nav entry', () => {
    const hasVisitorsNav = consoleTour.some(
      (step) => step.element === '[data-tour="nav-visitors"]'
    );
    expect(hasVisitorsNav).toBe(true);
  });

  it('all popover sides should be valid placement values', () => {
    const validSides = ['top', 'right', 'bottom', 'left', undefined];
    consoleTour.forEach((step, i) => {
      expect(
        validSides.includes(step.popover.side),
        `step ${i} side`
      ).toBe(true);
    });
  });
});

describe('adminTour', () => {
  it('should have at least 4 steps', () => {
    expect(adminTour.length).toBeGreaterThanOrEqual(4);
  });

  it('should have all steps with a non-empty element selector', () => {
    adminTour.forEach((step, i) => {
      expect(step.element, `step ${i} element`).toBeTruthy();
      expect(step.element.startsWith('[data-tour=')).toBe(true);
    });
  });

  it('should have all steps with a popover title and description', () => {
    adminTour.forEach((step, i) => {
      expect(step.popover.title, `step ${i} title`).toBeTruthy();
      expect(step.popover.description, `step ${i} description`).toBeTruthy();
    });
  });

  it('first step should navigate to /dashboard', () => {
    expect(adminTour[0].route).toBe('/dashboard');
  });

  it('should include a step for users route /users', () => {
    const hasUsers = adminTour.some((step) => step.route === '/users');
    expect(hasUsers).toBe(true);
  });

  it('should include a step for AI config route /ai', () => {
    const hasAi = adminTour.some((step) => step.route === '/ai');
    expect(hasAi).toBe(true);
  });

  it('should include a step for integrations route /integrations', () => {
    const hasIntegrations = adminTour.some(
      (step) => step.route === '/integrations'
    );
    expect(hasIntegrations).toBe(true);
  });

  it('all popover sides should be valid placement values', () => {
    const validSides = ['top', 'right', 'bottom', 'left', undefined];
    adminTour.forEach((step, i) => {
      expect(
        validSides.includes(step.popover.side),
        `step ${i} side`
      ).toBe(true);
    });
  });
});
