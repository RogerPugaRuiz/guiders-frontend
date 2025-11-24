import { Injectable, computed, inject, signal } from '@angular/core';
import {
  OnboardingState,
  OnboardingTour,
  ActiveTourState,
  OnboardingStep,
  TourRegistry,
} from '@guiders-frontend/shared/types';
import { UserService } from './user.service';

/**
 * Service to manage user onboarding and guided tours
 * Handles tour registration, state persistence, and tour navigation
 */
@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly userService = inject(UserService);

  private readonly STORAGE_KEY = 'guiders-onboarding-state';
  private readonly PREFERENCES_KEY = 'guiders-onboarding-preferences';

  // Tour registry
  private readonly tourRegistry = signal<TourRegistry>({
    tours: new Map(),
    toursByRoute: new Map(),
  });

  // Active tour state
  private readonly activeTourState = signal<ActiveTourState | null>(null);

  // User onboarding state
  private readonly onboardingState = signal<OnboardingState | null>(null);

  // Computed signals
  readonly activeTour = computed(() => this.activeTourState()?.tour ?? null);
  readonly currentStep = computed(() => {
    const state = this.activeTourState();
    if (!state) return null;
    return state.tour.steps[state.currentStepIndex] ?? null;
  });
  readonly currentStepIndex = computed(
    () => this.activeTourState()?.currentStepIndex ?? 0
  );
  readonly isActive = computed(() => this.activeTourState()?.isActive ?? false);
  readonly isPaused = computed(() => this.activeTourState()?.isPaused ?? false);
  readonly totalSteps = computed(() => this.activeTour()?.steps.length ?? 0);
  readonly progress = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return 0;
    return ((this.currentStepIndex() + 1) / total) * 100;
  });
  readonly hasCompletedInitialSetup = computed(
    () => this.onboardingState()?.hasCompletedInitialSetup ?? false
  );
  readonly completedTours = computed(
    () => this.onboardingState()?.completedTours ?? []
  );

  constructor() {
    this.loadOnboardingState();
  }

  /**
   * Register a new tour in the system
   */
  registerTour(tour: OnboardingTour): void {
    const registry = this.tourRegistry();
    registry.tours.set(tour.id, tour);

    if (tour.route) {
      const routeTours = registry.toursByRoute.get(tour.route) ?? [];
      routeTours.push(tour);
      // Sort by priority (lower number = higher priority)
      routeTours.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
      registry.toursByRoute.set(tour.route, routeTours);
    }

    this.tourRegistry.set({ ...registry });
  }

  /**
   * Register multiple tours at once
   */
  registerTours(tours: OnboardingTour[]): void {
    tours.forEach((tour) => this.registerTour(tour));
  }

  /**
   * Get a tour by ID
   */
  getTour(tourId: string): OnboardingTour | undefined {
    return this.tourRegistry().tours.get(tourId);
  }

  /**
   * Get all tours for a specific route
   */
  getToursForRoute(route: string): OnboardingTour[] {
    return this.tourRegistry().toursByRoute.get(route) ?? [];
  }

  /**
   * Check if a tour has been completed
   */
  isTourCompleted(tourId: string): boolean {
    return this.completedTours().includes(tourId);
  }

  /**
   * Check if a tour has been skipped
   */
  isTourSkipped(tourId: string): boolean {
    return this.onboardingState()?.skippedTours.includes(tourId) ?? false;
  }

  /**
   * Start a tour
   */
  async startTour(tourId: string): Promise<boolean> {
    const tour = this.getTour(tourId);
    if (!tour) {
      console.error(`Tour with id "${tourId}" not found`);
      return false;
    }

    // Don't restart completed tours
    if (this.isTourCompleted(tourId)) {
      console.log(`Tour "${tourId}" already completed`);
      return false;
    }

    // Get last completed step for this tour (for resuming)
    const state = this.onboardingState();
    const completedSteps = state?.completedSteps[tourId] ?? [];
    const startIndex = completedSteps.length;

    this.activeTourState.set({
      tour,
      currentStepIndex: startIndex,
      isActive: true,
      isPaused: false,
    });

    // Execute beforeShow hook for the first step
    const firstStep = tour.steps[startIndex];
    if (firstStep?.beforeShow) {
      await firstStep.beforeShow();
    }

    return true;
  }

  /**
   * Navigate to the next step
   */
  async nextStep(): Promise<void> {
    const state = this.activeTourState();
    if (!state) return;

    const currentStep = state.tour.steps[state.currentStepIndex];

    // Execute afterComplete hook
    if (currentStep?.afterComplete) {
      await currentStep.afterComplete();
    }

    // Mark step as completed
    this.markStepCompleted(state.tour.id, currentStep.id);

    // Check if there are more steps
    if (state.currentStepIndex < state.tour.steps.length - 1) {
      const nextIndex = state.currentStepIndex + 1;
      const nextStep = state.tour.steps[nextIndex];

      // Execute beforeShow hook for next step
      if (nextStep?.beforeShow) {
        await nextStep.beforeShow();
      }

      this.activeTourState.set({
        ...state,
        currentStepIndex: nextIndex,
      });
    } else {
      // Tour completed
      this.completeTour();
    }
  }

  /**
   * Navigate to the previous step
   */
  async previousStep(): Promise<void> {
    const state = this.activeTourState();
    if (!state || state.currentStepIndex === 0) return;

    const prevIndex = state.currentStepIndex - 1;
    const prevStep = state.tour.steps[prevIndex];

    // Execute beforeShow hook for previous step
    if (prevStep?.beforeShow) {
      await prevStep.beforeShow();
    }

    this.activeTourState.set({
      ...state,
      currentStepIndex: prevIndex,
    });
  }

  /**
   * Skip the current tour
   */
  skipTour(): void {
    const state = this.activeTourState();
    if (!state) return;

    const onboarding = this.onboardingState();
    if (onboarding) {
      onboarding.skippedTours.push(state.tour.id);
      this.saveOnboardingState(onboarding);
    }

    this.activeTourState.set(null);
  }

  /**
   * Pause the current tour
   */
  pauseTour(): void {
    const state = this.activeTourState();
    if (!state) return;

    this.activeTourState.set({
      ...state,
      isPaused: true,
    });
  }

  /**
   * Resume the paused tour
   */
  resumeTour(): void {
    const state = this.activeTourState();
    if (!state) return;

    this.activeTourState.set({
      ...state,
      isPaused: false,
    });
  }

  /**
   * Complete the current tour
   */
  completeTour(): void {
    const state = this.activeTourState();
    if (!state) return;

    const onboarding = this.onboardingState();
    if (onboarding && !onboarding.completedTours.includes(state.tour.id)) {
      onboarding.completedTours.push(state.tour.id);
      onboarding.lastUpdated = new Date();
      this.saveOnboardingState(onboarding);
    }

    this.activeTourState.set(null);
  }

  /**
   * Mark a specific step as completed
   */
  private markStepCompleted(tourId: string, stepId: string): void {
    const state = this.onboardingState();
    if (!state) return;

    if (!state.completedSteps[tourId]) {
      state.completedSteps[tourId] = [];
    }

    if (!state.completedSteps[tourId].includes(stepId)) {
      state.completedSteps[tourId].push(stepId);
      this.saveOnboardingState(state);
    }
  }

  /**
   * Mark initial setup as completed
   */
  completeInitialSetup(): void {
    const state = this.onboardingState();
    if (state) {
      state.hasCompletedInitialSetup = true;
      state.lastUpdated = new Date();
      this.saveOnboardingState(state);
    }
  }

  /**
   * Reset onboarding state (for testing or user request)
   */
  resetOnboarding(): void {
    const userId = this.userService.getUserId();
    if (!userId) return;

    const freshState: OnboardingState = {
      userId,
      hasCompletedInitialSetup: false,
      completedTours: [],
      skippedTours: [],
      completedSteps: {},
      showHints: true,
      autoStartTours: true,
      lastUpdated: new Date(),
    };

    this.onboardingState.set(freshState);
    this.saveOnboardingState(freshState);
    this.activeTourState.set(null);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: {
    showHints?: boolean;
    autoStartTours?: boolean;
  }): void {
    const state = this.onboardingState();
    if (!state) return;

    if (preferences.showHints !== undefined) {
      state.showHints = preferences.showHints;
    }
    if (preferences.autoStartTours !== undefined) {
      state.autoStartTours = preferences.autoStartTours;
    }

    state.lastUpdated = new Date();
    this.saveOnboardingState(state);
  }

  /**
   * Load onboarding state from localStorage
   */
  private loadOnboardingState(): void {
    const userId = this.userService.getUserId();
    if (!userId) {
      console.warn('Cannot load onboarding state: no user ID');
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state: OnboardingState = JSON.parse(stored);

        // Validate it's for the current user
        if (state.userId === userId) {
          // Convert date strings back to Date objects
          state.lastUpdated = new Date(state.lastUpdated);
          this.onboardingState.set(state);
          return;
        }
      }

      // Create new state for this user
      const newState: OnboardingState = {
        userId,
        hasCompletedInitialSetup: false,
        completedTours: [],
        skippedTours: [],
        completedSteps: {},
        showHints: true,
        autoStartTours: true,
        lastUpdated: new Date(),
      };

      this.onboardingState.set(newState);
      this.saveOnboardingState(newState);
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  }

  /**
   * Save onboarding state to localStorage
   */
  private saveOnboardingState(state: OnboardingState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      this.onboardingState.set(state);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  /**
   * Check and auto-start tours for a route
   */
  autoStartToursForRoute(route: string): void {
    const state = this.onboardingState();
    if (!state?.autoStartTours) return;

    const tours = this.getToursForRoute(route);
    const eligibleTour = tours.find(
      (tour) =>
        tour.autoStart &&
        !this.isTourCompleted(tour.id) &&
        !this.isTourSkipped(tour.id)
    );

    if (eligibleTour) {
      // Small delay to ensure page is rendered
      setTimeout(() => {
        this.startTour(eligibleTour.id);
      }, 500);
    }
  }
}
