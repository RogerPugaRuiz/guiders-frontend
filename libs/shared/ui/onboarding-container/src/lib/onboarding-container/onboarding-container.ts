import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService } from '@guiders-frontend/auth/data-access/session';
import { OnboardingSpotlight } from '@guiders-frontend/onboarding-spotlight';
import { OnboardingTour } from '@guiders-frontend/onboarding-tour';

/**
 * Onboarding Container Component
 * Orchestrates the spotlight and tour components based on OnboardingService state
 * Place this component at the root of your app to enable onboarding
 */
@Component({
  selector: 'guiders-onboarding-container',
  imports: [CommonModule, OnboardingSpotlight, OnboardingTour],
  templateUrl: './onboarding-container.html',
  styleUrl: './onboarding-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingContainer {
  protected readonly onboardingService = inject(OnboardingService);

  // Expose service signals to template
  readonly isActive = this.onboardingService.isActive;
  readonly currentStep = this.onboardingService.currentStep;
  readonly currentStepIndex = this.onboardingService.currentStepIndex;
  readonly totalSteps = this.onboardingService.totalSteps;
  readonly activeTour = this.onboardingService.activeTour;

  /**
   * Handle next step
   */
  handleNext(): void {
    this.onboardingService.nextStep();
  }

  /**
   * Handle previous step
   */
  handlePrevious(): void {
    this.onboardingService.previousStep();
  }

  /**
   * Handle skip tour
   */
  handleSkip(): void {
    this.onboardingService.skipTour();
  }

  /**
   * Handle close tour
   */
  handleClose(): void {
    this.onboardingService.skipTour();
  }
}
