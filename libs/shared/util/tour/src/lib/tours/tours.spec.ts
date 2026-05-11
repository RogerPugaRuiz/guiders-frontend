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

  it('should include a step for visitors route /visitors', () => {
    const hasVisitors = consoleTour.some((step) => step.route === '/visitors');
    expect(hasVisitors).toBe(true);
  });

  it('should include the sidebar-header step', () => {
    const hasSidebar = consoleTour.some(
      (step) => step.element === '[data-tour="sidebar-header"]'
    );
    expect(hasSidebar).toBe(true);
  });

  it('should include at least one action step', () => {
    const actionSteps = consoleTour.filter((step) => step.mode === 'action');
    expect(actionSteps.length).toBeGreaterThanOrEqual(1);
  });

  it('should include an action step targeting the first conversation item', () => {
    const hasConvAction = consoleTour.some(
      (step) =>
        step.mode === 'action' &&
        step.element === '[data-tour="conversation-item-first"]'
    );
    expect(hasConvAction).toBe(true);
  });

  it('should include an action step targeting the message input', () => {
    const hasMsgAction = consoleTour.some(
      (step) =>
        step.mode === 'action' &&
        step.element === '[data-tour="message-input"]'
    );
    expect(hasMsgAction).toBe(true);
  });

  it('message-input action step should await the message-sent-demo event', () => {
    const msgStep = consoleTour.find(
      (step) =>
        step.mode === 'action' &&
        step.element === '[data-tour="message-input"]'
    );
    expect(msgStep).toBeDefined();
    expect(msgStep?.awaitEvent?.event).toBe('message-sent-demo');
  });

  it('should include an action step targeting the advanced filters button', () => {
    const hasFilterAction = consoleTour.some(
      (step) =>
        step.mode === 'action' &&
        step.element === '[data-tour="visitors-advanced-btn"]'
    );
    expect(hasFilterAction).toBe(true);
  });

  it('should include an action step targeting the first visitor item', () => {
    const hasVisitorAction = consoleTour.some(
      (step) =>
        step.mode === 'action' &&
        step.element === '[data-tour="visitor-item-first"]'
    );
    expect(hasVisitorAction).toBe(true);
  });

  it('all popover sides should be valid driver.js values', () => {
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

  it('all popover sides should be valid driver.js values', () => {
    const validSides = ['top', 'right', 'bottom', 'left', undefined];
    adminTour.forEach((step, i) => {
      expect(
        validSides.includes(step.popover.side),
        `step ${i} side`
      ).toBe(true);
    });
  });
});
