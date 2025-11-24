/**
 * Onboarding and User Guide System Types
 * Defines interfaces for the step-by-step user guidance system
 */

/**
 * Position configuration for the tour tooltip
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Individual step in a tour
 */
export interface OnboardingStep {
  /** Unique identifier for the step */
  id: string;

  /** Title displayed in the tooltip */
  title: string;

  /** Description/content of the step */
  description: string;

  /** CSS selector for the element to highlight (optional for center-screen modals) */
  target?: string;

  /** Position of the tooltip relative to the target */
  position?: TooltipPosition;

  /** Action button text (default: "Next") */
  actionLabel?: string;

  /** Whether this step can be skipped */
  skippable?: boolean;

  /** Wait time in ms before showing this step (for async content) */
  delay?: number;

  /** Function to execute before showing this step */
  beforeShow?: () => void | Promise<void>;

  /** Function to execute after completing this step */
  afterComplete?: () => void | Promise<void>;
}

/**
 * Complete tour configuration
 */
export interface OnboardingTour {
  /** Unique identifier for the tour */
  id: string;

  /** Display name of the tour */
  name: string;

  /** Brief description of what the tour covers */
  description: string;

  /** Route or section this tour applies to */
  route?: string;

  /** Array of steps in the tour */
  steps: OnboardingStep[];

  /** Whether to auto-start this tour for new users */
  autoStart?: boolean;

  /** Priority order (lower numbers = higher priority) */
  priority?: number;
}

/**
 * User's onboarding progress and preferences
 */
export interface OnboardingState {
  /** User ID this state belongs to */
  userId: string;

  /** Whether user has completed first-time setup */
  hasCompletedInitialSetup: boolean;

  /** Tours that have been completed */
  completedTours: string[];

  /** Tours that have been skipped */
  skippedTours: string[];

  /** Individual steps that have been completed (for resuming) */
  completedSteps: Record<string, string[]>; // tourId -> stepIds

  /** User preference: show hints and tooltips */
  showHints: boolean;

  /** User preference: auto-start tours */
  autoStartTours: boolean;

  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Active tour state
 */
export interface ActiveTourState {
  /** Current tour being displayed */
  tour: OnboardingTour;

  /** Current step index */
  currentStepIndex: number;

  /** Whether tour is running */
  isActive: boolean;

  /** Whether tour is paused */
  isPaused: boolean;
}

/**
 * Tour registry for managing available tours
 */
export interface TourRegistry {
  /** All registered tours */
  tours: Map<string, OnboardingTour>;

  /** Tours organized by route */
  toursByRoute: Map<string, OnboardingTour[]>;
}
