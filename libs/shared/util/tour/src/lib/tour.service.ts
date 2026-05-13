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
import { visitorsTour } from './tours/visitors.tour';
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
      steps: this.buildShepherdSteps(steps, (): Tour => tour, tourId, userId),
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
      case 'visitors':
        return visitorsTour;
    }
  }

  private buildShepherdSteps(
    steps: TourStepConfig[],
    getTour: () => Tour,
    tourId: TourId,
    userId: string
  ): StepOptions[] {
    const total = steps.length;
    return steps.map((step, idx) => {
      const isLast = idx === total - 1;

      // NOTE: Interactive auto-advance (advanceOn / awaitClick / awaitEvent)
      // is intentionally disabled — every step renders Prev/Next buttons so
      // the user fully controls progression. The `mode: 'action'` flag and
      // `awaitEvent`/`awaitClick` config are kept in the public API for
      // future re-enablement but are ignored here.

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
        // Target stays non-interactive by default so clicks on it don't
        // accidentally trigger app behavior while the user reads. Opt-in
        // per step via `allowInteraction: true` if needed.
        canClickTarget: step.allowInteraction === true,
        // Always render Prev (when not first) and Next/Done buttons.
        buttons: [
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
        // Always run lifecycle hooks before showing the step so cross-domain
        // hooks can prepare UI state (open panels, select demo entities,
        // etc.) automatically. Hooks run BEFORE navigation so they can
        // mutate state ahead of the routed view's first render.
        beforeShowPromise: async () => {
          await this.runBeforeStepHooks(idx, tourId, userId);
          if (step.route) {
            const currentUrl = this.router.url.split('?')[0];
            if (currentUrl !== step.route) {
              await this.navigateTo(step.route);
              // Let Angular finish rendering routed components / dynamic UI
              // (e.g. visitor detail panel that appears after a click).
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
        },
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

  /**
   * Runs the optional `onBeforeStep` lifecycle hook for every registered
   * contributor before Shepherd renders a given step. Errors are swallowed
   * (logged) so a misbehaving hook cannot abort the tour mid-flow.
   */
  private async runBeforeStepHooks(
    stepIndex: number,
    tourId: TourId,
    userId: string
  ): Promise<void> {
    if (!this.lifecycleHooks.length) return;
    await Promise.all(
      this.lifecycleHooks.map(async (hook) => {
        if (typeof hook.onBeforeStep !== 'function') return;
        try {
          await hook.onBeforeStep(stepIndex, tourId, userId);
        } catch (err) {
          console.error(
            `[TourService] onBeforeStep hook failed (step ${stepIndex})`,
            err
          );
        }
      })
    );
  }
}
