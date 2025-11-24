import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  effect,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OnboardingStep,
  TooltipPosition,
} from '@guiders-frontend/shared/types';
import { Button } from '@guiders-frontend/button';

/**
 * Onboarding Tour Component
 * Displays a floating tooltip panel with tour step information
 * Positioned relative to the highlighted element
 */
@Component({
  selector: 'guiders-onboarding-tour',
  imports: [CommonModule, Button],
  templateUrl: './onboarding-tour.html',
  styleUrl: './onboarding-tour.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingTour {
  private readonly elementRef = inject(ElementRef);

  // === INPUTS ===
  /** Current step to display */
  readonly step = input.required<OnboardingStep>();

  /** Current step number (1-indexed) */
  readonly stepNumber = input<number>(1);

  /** Total number of steps */
  readonly totalSteps = input<number>(1);

  /** Whether to show the previous button */
  readonly showPrevious = input<boolean>(true);

  /** Whether to show the skip button */
  readonly showSkip = input<boolean>(true);

  /** Whether the tour is active */
  readonly isActive = input<boolean>(true);

  // === OUTPUTS ===
  readonly next = output<void>();
  readonly previous = output<void>();
  readonly skip = output<void>();
  readonly close = output<void>();

  // === STATE ===
  private readonly tooltipPosition = signal<{
    top: string;
    left: string;
    transform: string;
  } | null>(null);

  // === COMPUTED ===
  readonly isFirstStep = computed(() => this.stepNumber() === 1);
  readonly isLastStep = computed(() => this.stepNumber() === this.totalSteps());

  readonly progressPercent = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return 0;
    return (this.stepNumber() / total) * 100;
  });

  readonly actionButtonLabel = computed(() => {
    if (this.isLastStep()) return 'Finalizar';
    return this.step().actionLabel || 'Siguiente';
  });

  readonly tooltipStyles = computed(() => {
    const position = this.tooltipPosition();
    if (!position) return {};
    return position;
  });

  constructor() {
    // Update position when step changes
    effect(() => {
      const step = this.step();
      const isActive = this.isActive();

      if (isActive && step.target) {
        // Small delay to ensure spotlight is rendered
        setTimeout(() => {
          this.updatePosition(step.target!, step.position);
        }, 100);
      } else if (isActive && !step.target) {
        // Center position for steps without target
        this.setCenterPosition();
      }
    });
  }

  /**
   * Update tooltip position based on target element
   */
  private updatePosition(
    selector: string,
    position: TooltipPosition = 'bottom'
  ): void {
    try {
      const targetElement = document.querySelector(selector) as HTMLElement;
      if (!targetElement) {
        console.warn(`Tour target not found: ${selector}`);
        this.setCenterPosition();
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipElement = this.elementRef.nativeElement
        .firstElementChild as HTMLElement;

      if (!tooltipElement) {
        this.setCenterPosition();
        return;
      }

      const tooltipRect = tooltipElement.getBoundingClientRect();
      const spacing = 16; // Gap between target and tooltip

      let top = 0;
      let left = 0;
      let transform = '';

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - spacing;
          left = targetRect.left + targetRect.width / 2;
          transform = 'translateX(-50%)';
          break;

        case 'bottom':
          top = targetRect.bottom + spacing;
          left = targetRect.left + targetRect.width / 2;
          transform = 'translateX(-50%)';
          break;

        case 'left':
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.left - tooltipRect.width - spacing;
          transform = 'translateY(-50%)';
          break;

        case 'right':
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.right + spacing;
          transform = 'translateY(-50%)';
          break;

        case 'center':
        default:
          this.setCenterPosition();
          return;
      }

      // Ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if out of bounds
      if (left < 10) {
        left = 10;
        transform = '';
      } else if (left + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - tooltipRect.width - 10;
        transform = '';
      }

      // Adjust vertical position if out of bounds
      if (top < 10) {
        top = 10;
      } else if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10;
      }

      this.tooltipPosition.set({
        top: `${top}px`,
        left: `${left}px`,
        transform,
      });
    } catch (error) {
      console.error('Error updating tour position:', error);
      this.setCenterPosition();
    }
  }

  /**
   * Set tooltip to center of screen
   */
  private setCenterPosition(): void {
    this.tooltipPosition.set({
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    });
  }

  /**
   * Handle next button click
   */
  handleNext(): void {
    this.next.emit();
  }

  /**
   * Handle previous button click
   */
  handlePrevious(): void {
    this.previous.emit();
  }

  /**
   * Handle skip button click
   */
  handleSkip(): void {
    this.skip.emit();
  }

  /**
   * Handle close button click
   */
  handleClose(): void {
    this.close.emit();
  }
}
