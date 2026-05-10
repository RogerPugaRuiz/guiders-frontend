import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { driver, DriveStep } from 'driver.js';
import { filter, firstValueFrom } from 'rxjs';
import { TourId, TourStepConfig } from './tour-step.interface';
import { consoleTour } from './tours/console.tour';
import { adminTour } from './tours/admin.tour';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
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

    const steps = this.resolveSteps(tourId);

    if (!steps.length) {
      this._isRunning = false;
      return;
    }

    // Wait for the router to complete its initial navigation before
    // attempting to navigate to the first tour step. If the router has
    // already navigated (router.navigated === true) this resolves instantly.
    if (!this.router.navigated) {
      await Promise.race([
        firstValueFrom(
          this.router.events.pipe(filter((e) => e instanceof NavigationEnd))
        ),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }

    // Navigate to the first step route
    const firstRoute = steps[0].route;
    if (firstRoute) {
      // Subscribe to NavigationEnd BEFORE calling navigate to avoid race condition
      const navigationDone$ = this.router.events.pipe(
        filter((e) => e instanceof NavigationEnd)
      );
      const navigationComplete = firstValueFrom(navigationDone$);
      await this.router.navigate([firstRoute]);
      await Promise.race([
        navigationComplete,
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    // Extra tick to let Angular finish rendering the routed component tree
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Track currently registered auto-advance listener so we can clean it up
    // when the active step changes or the tour is destroyed.
    let activeListenerCleanup: (() => void) | null = null;
    const cleanupActiveListener = () => {
      if (activeListenerCleanup) {
        activeListenerCleanup();
        activeListenerCleanup = null;
      }
    };

    const driverInstance = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Entendido!',
      onHighlighted: (_el, _step, { state }) => {
        // Wire up auto-advance for action steps when the step becomes active.
        cleanupActiveListener();
        const idx = state.activeIndex ?? 0;
        const stepCfg = steps[idx];
        if (!stepCfg || stepCfg.mode !== 'action') return;

        const target = stepCfg.awaitEvent?.selector ?? stepCfg.element;
        const eventName = stepCfg.awaitEvent?.event ?? 'click';
        const node = document.querySelector(target);
        if (!node) return; // Fallback: keep Next button visible

        const handler = () => {
          cleanupActiveListener();
          // Defer to next tick so the user sees the action take effect.
          setTimeout(() => driverInstance.moveNext(), 50);
        };
        node.addEventListener(eventName, handler, { once: true });
        activeListenerCleanup = () => node.removeEventListener(eventName, handler);
      },
      onDeselected: () => {
        cleanupActiveListener();
      },
      onPopoverRender: (popover, { config, state }) => {
        // Hide the Next button on action steps so the user is forced to perform the action
        const idx = state.activeIndex ?? 0;
        const stepCfg = steps[idx];
        const nextBtn = popover.nextButton as HTMLElement | undefined;
        if (nextBtn) {
          nextBtn.style.display = stepCfg?.mode === 'action' ? 'none' : '';
        }
        // Replace native close button with a custom one we fully control
        const nativeClose = popover.closeButton as HTMLElement | undefined;
        if (nativeClose) {
          nativeClose.style.display = 'none';
        }
        const existing = popover.wrapper.querySelector('.guiders-tour-close');
        if (!existing) {
          const btn = document.createElement('button');
          btn.className = 'guiders-tour-close';
          btn.setAttribute('aria-label', 'Cerrar tour');
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          </svg>`;
          btn.addEventListener('click', () => driverInstance.destroy());
          popover.wrapper.appendChild(btn);
        }

        // Progress bar above footer
        const total = (config.steps ?? []).length;
        const current = (state.activeIndex ?? 0) + 1;
        const pct = total > 0 ? (current / total) * 100 : 0;

        let bar = popover.wrapper.querySelector('.guiders-tour-progress') as HTMLElement | null;
        if (!bar) {
          bar = document.createElement('div');
          bar.className = 'guiders-tour-progress';
          const fill = document.createElement('div');
          fill.className = 'guiders-tour-progress__fill';
          bar.appendChild(fill);
          popover.footer.before(bar);
        }
        const fill = bar.querySelector('.guiders-tour-progress__fill') as HTMLElement;
        fill.style.width = `${pct}%`;
      },
      onDestroyed: () => {
        cleanupActiveListener();
        this._isRunning = false;
        this.markCompleted(tourId, userId);
      },
      steps: this.buildDriveSteps(steps),
    });

    driverInstance.drive();
  }

  private resolveSteps(tourId: TourId): TourStepConfig[] {
    switch (tourId) {
      case 'console': return consoleTour;
      case 'admin':   return adminTour;
    }
  }

  private buildDriveSteps(steps: TourStepConfig[]): DriveStep[] {
    return steps.map((step) => ({
      element: step.element,
      // Action steps need the highlighted element to remain interactive
      disableActiveInteraction:
        step.mode === 'action' || step.allowInteraction ? false : undefined,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        side: step.popover.side,
        align: step.popover.align,
      },
    }));
  }
}
