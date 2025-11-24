import {
  Component,
  input,
  effect,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SpotlightTarget {
  element: HTMLElement;
  padding?: number;
}

/**
 * Onboarding Spotlight Component
 * Creates a dark overlay with a highlighted area around a target element
 * Used to focus user attention during guided tours
 */
@Component({
  selector: 'guiders-onboarding-spotlight',
  imports: [CommonModule],
  templateUrl: './onboarding-spotlight.html',
  styleUrl: './onboarding-spotlight.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingSpotlight {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  // === INPUTS ===
  /** CSS selector for the element to highlight */
  readonly targetSelector = input<string | null>(null);

  /** Padding around the highlighted element (in pixels) */
  readonly padding = input<number>(8);

  /** Whether the spotlight is active */
  readonly isActive = input<boolean>(true);

  /** Border radius for the spotlight cutout */
  readonly borderRadius = input<number>(8);

  /** Opacity of the overlay (0-1) */
  readonly overlayOpacity = input<number>(0.7);

  /** Z-index of the spotlight */
  readonly zIndex = input<number>(1400);

  // === STATE ===
  private readonly targetRect = signal<DOMRect | null>(null);
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  // === COMPUTED ===
  readonly spotlightStyles = computed(() => {
    const rect = this.targetRect();
    if (!rect) return null;

    const padding = this.padding();
    const borderRadius = this.borderRadius();

    return {
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
      borderRadius: `${borderRadius}px`,
    };
  });

  readonly overlayStyles = computed(() => ({
    opacity: this.overlayOpacity(),
    zIndex: this.zIndex(),
  }));

  readonly hasTarget = computed(() => this.targetRect() !== null);

  constructor() {
    // Update target when selector changes
    effect(() => {
      const selector = this.targetSelector();
      const isActive = this.isActive();

      if (isActive && selector) {
        this.updateTarget(selector);
        this.setupObservers(selector);
      } else {
        this.clearTarget();
        this.cleanupObservers();
      }
    });
  }

  /**
   * Update the target element and calculate its position
   */
  private updateTarget(selector: string): void {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        this.targetRect.set(rect);

        // Scroll element into view if needed
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      } else {
        console.warn(`Spotlight target not found: ${selector}`);
        this.targetRect.set(null);
      }
    } catch (error) {
      console.error('Error updating spotlight target:', error);
      this.targetRect.set(null);
    }
  }

  /**
   * Clear the current target
   */
  private clearTarget(): void {
    this.targetRect.set(null);
  }

  /**
   * Setup observers to track target element changes
   */
  private setupObservers(selector: string): void {
    this.cleanupObservers();

    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    // Observe element resize
    this.resizeObserver = new ResizeObserver(() => {
      this.updateTarget(selector);
    });
    this.resizeObserver.observe(element);

    // Observe DOM mutations that might affect layout
    this.mutationObserver = new MutationObserver(() => {
      this.updateTarget(selector);
    });
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    // Also update on scroll and window resize
    window.addEventListener('scroll', this.handleScroll, true);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Cleanup observers
   */
  private cleanupObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    window.removeEventListener('scroll', this.handleScroll, true);
    window.removeEventListener('resize', this.handleResize);
  }

  private readonly handleScroll = (): void => {
    const selector = this.targetSelector();
    if (selector) {
      this.updateTarget(selector);
    }
  };

  private readonly handleResize = (): void => {
    const selector = this.targetSelector();
    if (selector) {
      this.updateTarget(selector);
    }
  };

  ngOnDestroy(): void {
    this.cleanupObservers();
  }
}
