import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import Shepherd, { type Tour, type StepOptions } from 'shepherd.js';
import { filter, firstValueFrom } from 'rxjs';
import {
  TourId,
  TourStepConfig,
  TourStepPopover,
} from './tour-step.interface';
import { consoleTour } from './tours/console.tour';
import { adminTour } from './tours/admin.tour';
import { TOUR_LIFECYCLE_HOOKS, TourLifecycleHook } from './tour-lifecycle-hook';

/**
 * Maps our internal `side`/`align` to a Shepherd/Popper placement string.
 * Defaults to `'bottom'` when no side is provided.
 */
function toPopperPlacement(popover: TourStepPopover): string {
  const side = popover.side ?? 'bottom';
  const align = popover.align;
  if (!align || align === 'center') return side;
  return `${side}-${align}`;
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
  /**
   * Lifecycle hooks contributed by other domains (e.g. chat sandbox setup).
   * Optional — empty array when no domain has registered a hook.
   * Decoupled via {@link TOUR_LIFECYCLE_HOOKS} multi-provider to keep
   * `scope:shared` free of `scope:chat` imports.
   */
  private readonly lifecycleHooks =
    inject<TourLifecycleHook[]>(TOUR_LIFECYCLE_HOOKS, { optional: true }) ?? [];
  private _isRunning = false;
  /**
   * In-memory record of which (tourId, userId) pairs have already been started
   * during this app session. Survives component re-creations and signal
   * re-emissions. Cleared per-pair by `resetTour()`.
   */
  private readonly _startedPairs = new Set<string>();

  get isRunning(): boolean {
    return this._isRunning;
  }

  private storageKey(tourId: TourId, userId: string): string {
    return `guiders_tour_${tourId}_${userId}`;
  }

  private pairKey(tourId: TourId, userId: string): string {
    return `${tourId}:${userId}`;
  }

  hasStartedFor(tourId: TourId, userId: string): boolean {
    return this._startedPairs.has(this.pairKey(tourId, userId));
  }

  isCompleted(tourId: TourId, userId: string): boolean {
    return localStorage.getItem(this.storageKey(tourId, userId)) === 'true';
  }

  markCompleted(tourId: TourId, userId: string): void {
    localStorage.setItem(this.storageKey(tourId, userId), 'true');
  }

  resetTour(tourId: TourId, userId: string): void {
    localStorage.removeItem(this.storageKey(tourId, userId));
    this._startedPairs.delete(this.pairKey(tourId, userId));
    this._isRunning = false;
  }

  async startTour(tourId: TourId, userId: string): Promise<void> {
    if (this._isRunning) {
      return;
    }
    if (this.hasStartedFor(tourId, userId)) {
      return;
    }
    await this._launchTour(tourId, userId);
  }

  /** Force-restart the tour regardless of prior session state. */
  async restartTour(tourId: TourId, userId: string): Promise<void> {
    this.resetTour(tourId, userId);
    await this._launchTour(tourId, userId);
  }

  private async _launchTour(tourId: TourId, userId: string): Promise<void> {
    this._isRunning = true;
    this._startedPairs.add(this.pairKey(tourId, userId));

    // Notify lifecycle hooks (e.g. seed sandbox demo data). Failures must
    // not abort the tour — log and continue.
    await this.runHooks('start', tourId, userId);

    const steps = this.resolveSteps(tourId);

    if (!steps.length) {
      this._isRunning = false;
      return;
    }

    // Wait for the router to complete its initial navigation before
    // attempting to navigate to the first tour step.
    if (!this.router.navigated) {
      await Promise.race([
        firstValueFrom(
          this.router.events.pipe(filter((e) => e instanceof NavigationEnd))
        ),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }

    // Navigate to the first step route up-front so Shepherd can find the
    // attachTo element on initial show.
    const firstRoute = steps[0].route;
    if (firstRoute) {
      await this.navigateTo(firstRoute);
    }

    // Extra tick to let Angular finish rendering the routed component tree
    await new Promise((resolve) => setTimeout(resolve, 150));

    const tour: Tour = new Shepherd.Tour({
      useModalOverlay: true,
      keyboardNavigation: true,
      exitOnEsc: true,
      defaultStepOptions: {
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: { enabled: true, label: 'Cerrar tour' },
        modalOverlayOpeningPadding: 6,
        modalOverlayOpeningRadius: 8,
        classes: 'guiders-tour',
        arrow: true,
      },
      steps: this.buildShepherdSteps(steps, (): Tour => tour),
    });

    tour.on('complete', () => {
      this._isRunning = false;
      this.markCompleted(tourId, userId);
      void this.runHooks('end', tourId, userId);
    });
    tour.on('cancel', () => {
      this._isRunning = false;
      this.markCompleted(tourId, userId);
      void this.runHooks('end', tourId, userId);
    });

    tour.start();
  }

  private async navigateTo(route: string): Promise<void> {
    const navigationDone$ = this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd)
    );
    const navigationComplete = firstValueFrom(navigationDone$);
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl === route) return;
    await this.router.navigate([route]);
    await Promise.race([
      navigationComplete,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }

  private resolveSteps(tourId: TourId): TourStepConfig[] {
    switch (tourId) {
      case 'console':
        return consoleTour;
      case 'admin':
        return adminTour;
    }
  }

  private buildShepherdSteps(
    steps: TourStepConfig[],
    getTour: () => Tour
  ): StepOptions[] {
    const total = steps.length;
    return steps.map((step, idx) => {
      const isAction = step.mode === 'action';
      const isLast = idx === total - 1;
      const advanceSelector = step.awaitEvent?.selector ?? step.element;
      const advanceEvent = step.awaitEvent?.event ?? 'click';

      const stepOpts: StepOptions = {
        id: `step-${idx}`,
        attachTo: {
          element: step.element,
          // Shepherd uses Popper placement strings (e.g. 'left-start').
          // Cast through `any` because our public API constrains side/align
          // to a friendlier subset.
          on: toPopperPlacement(step.popover) as any,
        },
        title: step.popover.title,
        text: step.popover.description,
        // Action steps: target must be clickable AND we wire advanceOn so
        // Shepherd auto-advances when the user performs the real action.
        canClickTarget: isAction || step.allowInteraction === true,
        ...(isAction
          ? { advanceOn: { selector: advanceSelector, event: advanceEvent } }
          : {}),
        // Buttons: action steps render no Next button (forces interaction);
        // info steps render Prev (when not first) and Next/Done.
        buttons: isAction
          ? []
          : [
              ...(idx > 0
                ? [
                    {
                      text: '← Anterior',
                      secondary: true,
                      action(this: Tour) {
                        this.back();
                      },
                    },
                  ]
                : []),
              {
                text: isLast ? '¡Entendido!' : 'Siguiente →',
                action(this: Tour) {
                  if (isLast) {
                    this.complete();
                  } else {
                    this.next();
                  }
                },
              },
            ],
        // Navigate before showing this step (handles route transitions
        // between non-contiguous routes like /inbox → /visitors).
        beforeShowPromise: step.route
          ? async () => {
              await this.navigateTo(step.route!);
              // Let Angular finish rendering routed components / dynamic UI
              // (e.g. visitor detail panel that appears after a click).
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          : undefined,
        when: {
          show(this: any) {
            // Inject a thin progress bar above the footer for every step.
            const tourInst = getTour();
            const el: HTMLElement | null | undefined =
              typeof this.getElement === 'function' ? this.getElement() : this.el;
            if (!el) return;
            const current = idx + 1;
            const pct = total > 0 ? (current / total) * 100 : 0;
            let bar = el.querySelector(
              '.guiders-tour-progress'
            ) as HTMLElement | null;
            if (!bar) {
              bar = document.createElement('div');
              bar.className = 'guiders-tour-progress';
              const fill = document.createElement('div');
              fill.className = 'guiders-tour-progress__fill';
              bar.appendChild(fill);
              const footer = el.querySelector('.shepherd-footer');
              if (footer) {
                footer.before(bar);
              } else {
                el.appendChild(bar);
              }
            }
            const fill = bar.querySelector(
              '.guiders-tour-progress__fill'
            ) as HTMLElement;
            fill.style.width = `${pct}%`;

            // Render a small "X de Y" indicator inside the header.
            let counter = el.querySelector(
              '.guiders-tour-counter'
            ) as HTMLElement | null;
            if (!counter) {
              counter = document.createElement('div');
              counter.className = 'guiders-tour-counter';
              el.prepend(counter);
            }
            counter.textContent = `${current} de ${total}`;

            // Reference to silence unused-var lint on getTour in some configs.
            void tourInst;
          },
        },
      };

      return stepOpts;
    });
  }

  private async runHooks(
    phase: 'start' | 'end',
    tourId: TourId,
    userId: string
  ): Promise<void> {
    if (!this.lifecycleHooks.length) return;
    await Promise.all(
      this.lifecycleHooks.map(async (hook) => {
        try {
          if (phase === 'start') {
            await hook.onTourStart(tourId, userId);
          } else {
            await hook.onTourEnd(tourId, userId);
          }
        } catch (err) {
          console.error(`[TourService] lifecycle hook ${phase} failed`, err);
        }
      })
    );
  }
}
