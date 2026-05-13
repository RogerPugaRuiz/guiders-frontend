/**
 * TourUiBridgeService - signal-based bridge between the shared tour engine
 * and feature components (currently: Inbox).
 *
 * Why this exists: the tour lifecycle hook lives in `chat/util/tour-sandbox`
 * but cannot reach into the Inbox component's local signals without
 * breaking architectural boundaries. Inbox subscribes to these public
 * signals via `effect()` and synchronises its private UI state.
 *
 * Contract:
 * - All signals default to `false` (no UI changes requested).
 * - The hook calls `requestOpenVisitorPanel(true|false)` to drive the
 *   inbox's visitor detail panel during specific tour steps.
 * - `reset()` clears every flag — called by the hook on tour end so the
 *   next tour run starts from a clean slate and so non-tour navigation
 *   does not inherit forced panel state.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TourUiBridgeService {
  private readonly _visitorPanelOpenRequested = signal(false);

  /** Read-only signal Inbox listens to for forced-open requests. */
  readonly visitorPanelOpenRequested =
    this._visitorPanelOpenRequested.asReadonly();

  /** Request the visitor detail panel to be open (true) or closed (false). */
  requestOpenVisitorPanel(open: boolean): void {
    this._visitorPanelOpenRequested.set(open);
  }

  /** Clear all UI requests. Called by the tour lifecycle hook on end. */
  reset(): void {
    this._visitorPanelOpenRequested.set(false);
  }
}
