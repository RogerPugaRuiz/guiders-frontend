import { InjectionToken } from '@angular/core';
import { TourId } from './tour-step.interface';

/**
 * Lifecycle hook contract for cross-domain side effects coupled to the tour.
 *
 * The shared `TourService` cannot import from feature/data-access layers
 * (Nx boundaries: `scope:shared` → `scope:chat` is forbidden). Implementations
 * provided via {@link TOUR_LIFECYCLE_HOOKS} can inject any service they need
 * and run setup/teardown around a tour run.
 *
 * Both hooks are awaited; throwing from a hook will not prevent the tour
 * from running but will surface in the console.
 */
export interface TourLifecycleHook {
  /**
   * Called immediately after `_startedPairs.add(...)` and before the tour
   * navigates to the first step. Use to seed sandbox/demo data.
   */
  onTourStart(tourId: TourId, userId: string): void | Promise<void>;

  /**
   * Called inside the Shepherd `complete`/`cancel` callbacks, after the tour
   * is marked as completed. Use to tear down sandbox/demo data.
   */
  onTourEnd(tourId: TourId, userId: string): void | Promise<void>;
}

/**
 * Multi-provider token for {@link TourLifecycleHook} implementations.
 * Each domain that needs to react to tour lifecycle events registers its
 * own hook here without creating a hard dependency from `shared/util/tour`.
 */
export const TOUR_LIFECYCLE_HOOKS = new InjectionToken<TourLifecycleHook[]>(
  'TOUR_LIFECYCLE_HOOKS'
);
