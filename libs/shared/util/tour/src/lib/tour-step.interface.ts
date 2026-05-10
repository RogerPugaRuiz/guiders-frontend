export type TourId = 'console' | 'admin';

export interface TourStepPopover {
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Step interaction mode.
 * - `info`: Standard read-only step with a Next button (default).
 * - `action`: User must perform an action on the page to advance.
 *   The Next button is hidden and the tour auto-advances when
 *   the configured event/click is detected.
 */
export type TourStepMode = 'info' | 'action';

/**
 * Optional event-based advancement.
 * When set, the tour waits for `event` on the element matching `selector`
 * (defaults to the step's own `element`) before moving to the next step.
 */
export interface TourStepAwaitEvent {
  /** CSS selector of the element to listen on. Defaults to the step's `element`. */
  selector?: string;
  /** DOM event name to listen for (e.g. 'click', 'change', 'input'). */
  event: string;
}

export interface TourStepConfig {
  /** CSS selector of the element to highlight */
  element: string;
  /** Route to navigate to before showing this step */
  route?: string;
  popover: TourStepPopover;
  /**
   * Step mode. Defaults to `'info'` for backward compatibility.
   * `'action'` mode hides the Next button and auto-advances on the configured
   * event (or click on the highlighted element when no `awaitEvent` is set).
   */
  mode?: TourStepMode;
  /**
   * Wait for a click on the highlighted element to advance.
   * Implicit when `mode === 'action'` and `awaitEvent` is not set.
   */
  awaitClick?: boolean;
  /**
   * Wait for a specific event on a specific selector to advance.
   * Takes precedence over `awaitClick`.
   */
  awaitEvent?: TourStepAwaitEvent;
  /**
   * When true, the highlighted element remains interactive (user can click it).
   * Driver.js disables interaction by default; action steps need this enabled.
   */
  allowInteraction?: boolean;
}
