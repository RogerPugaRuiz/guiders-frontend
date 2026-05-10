import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TourService } from './tour.service';
import { TourId } from './tour-step.interface';

// Mock driver.js to avoid DOM dependencies in unit tests
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    moveNext: vi.fn(),
  })),
}));

/** Helper: mock router.navigate + router.events so startTour resolves */
function mockRouterNavigation(router: Router): void {
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  Object.defineProperty(router, 'events', {
    get: () => of(new NavigationEnd(1, '/', '/')),
    configurable: true,
  });
}

describe('TourService', () => {
  let service: TourService;
  let router: Router;

  const mockUserId = 'user-123';
  const consoleTourId: TourId = 'console';
  const adminTourId: TourId = 'admin';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [TourService],
    });

    service = TestBed.inject(TourService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --- isCompleted ---

  describe('isCompleted()', () => {
    it('should return false when tour has not been completed', () => {
      expect(service.isCompleted(consoleTourId, mockUserId)).toBe(false);
    });

    it('should return true after markCompleted is called', () => {
      service.markCompleted(consoleTourId, mockUserId);
      expect(service.isCompleted(consoleTourId, mockUserId)).toBe(true);
    });

    it('should be scoped per tourId — console completed does not affect admin', () => {
      service.markCompleted(consoleTourId, mockUserId);
      expect(service.isCompleted(adminTourId, mockUserId)).toBe(false);
    });

    it('should be scoped per userId — user-123 completed does not affect user-456', () => {
      service.markCompleted(consoleTourId, 'user-123');
      expect(service.isCompleted(consoleTourId, 'user-456')).toBe(false);
    });
  });

  // --- markCompleted ---

  describe('markCompleted()', () => {
    it('should persist console tour completion in localStorage with correct key', () => {
      service.markCompleted(consoleTourId, mockUserId);
      expect(localStorage.getItem('guiders_tour_console_user-123')).toBe('true');
    });

    it('should persist admin tour with its own key', () => {
      service.markCompleted(adminTourId, mockUserId);
      expect(localStorage.getItem('guiders_tour_admin_user-123')).toBe('true');
    });
  });

  // --- resetTour ---

  describe('resetTour()', () => {
    it('should remove the completion entry from localStorage', () => {
      service.markCompleted(consoleTourId, mockUserId);
      service.resetTour(consoleTourId, mockUserId);
      expect(service.isCompleted(consoleTourId, mockUserId)).toBe(false);
    });

    it('should only remove the specified tour, not others', () => {
      service.markCompleted(consoleTourId, mockUserId);
      service.markCompleted(adminTourId, mockUserId);
      service.resetTour(consoleTourId, mockUserId);
      expect(service.isCompleted(adminTourId, mockUserId)).toBe(true);
    });
  });

  // --- storageKey (indirect via behavior) ---

  describe('storage key format', () => {
    it('should use format guiders_tour_{tourId}_{userId}', () => {
      service.markCompleted('console', 'abc-def');
      expect(localStorage.getItem('guiders_tour_console_abc-def')).toBe('true');
    });
  });

  // --- startTour ---

  describe('startTour()', () => {
    it('should mark tour as completed when driver is destroyed', async () => {
      const { driver } = await import('driver.js');
      let destroyCallback: (() => void) | undefined;

      (driver as ReturnType<typeof vi.fn>).mockImplementation((config: { onDestroyed?: () => void }) => {
        destroyCallback = config.onDestroyed;
        return { drive: vi.fn(), destroy: vi.fn(), moveNext: vi.fn() };
      });

      mockRouterNavigation(router);

      await service.startTour(consoleTourId, mockUserId);

      // Simulate driver destruction (tour completed)
      destroyCallback?.();

      expect(service.isCompleted(consoleTourId, mockUserId)).toBe(true);
    });

    it('should navigate to /inbox for console tour first step', async () => {
      mockRouterNavigation(router);
      const navigateSpy = router.navigate as ReturnType<typeof vi.fn>;

      await service.startTour(consoleTourId, mockUserId);

      expect(navigateSpy).toHaveBeenCalledWith(['/inbox']);
    });

    it('should navigate to /dashboard for admin tour first step', async () => {
      mockRouterNavigation(router);
      const navigateSpy = router.navigate as ReturnType<typeof vi.fn>;

      await service.startTour(adminTourId, mockUserId);

      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not start a second tour if one is already running', async () => {
      const { driver } = await import('driver.js');
      const mockDrive = vi.fn();

      (driver as ReturnType<typeof vi.fn>).mockReturnValue({
        drive: mockDrive,
        destroy: vi.fn(),
        moveNext: vi.fn(),
      });

      mockRouterNavigation(router);

      // Call startTour twice concurrently — second call should be ignored
      await Promise.all([
        service.startTour(consoleTourId, mockUserId),
        service.startTour(consoleTourId, mockUserId),
      ]);

      expect(mockDrive).toHaveBeenCalledTimes(1);
    });

    it('should call driver.drive() to start the tour', async () => {
      const { driver } = await import('driver.js');
      const mockDrive = vi.fn();

      (driver as ReturnType<typeof vi.fn>).mockReturnValue({
        drive: mockDrive,
        destroy: vi.fn(),
        moveNext: vi.fn(),
      });

      mockRouterNavigation(router);

      await service.startTour(consoleTourId, mockUserId);

      expect(mockDrive).toHaveBeenCalled();
    });

    it('should not start a second time for the same user even after the first tour finished', async () => {
      const { driver } = await import('driver.js');
      const mockDrive = vi.fn();
      let destroyCallback: (() => void) | undefined;

      (driver as ReturnType<typeof vi.fn>).mockImplementation((config: { onDestroyed?: () => void }) => {
        destroyCallback = config.onDestroyed;
        return { drive: mockDrive, destroy: vi.fn(), moveNext: vi.fn() };
      });

      mockRouterNavigation(router);

      await service.startTour(consoleTourId, mockUserId);
      destroyCallback?.(); // first tour finishes
      await service.startTour(consoleTourId, mockUserId); // try again

      expect(mockDrive).toHaveBeenCalledTimes(1);
    });

    it('should allow restart after resetTour() is called', async () => {
      const { driver } = await import('driver.js');
      const mockDrive = vi.fn();
      let destroyCallback: (() => void) | undefined;

      (driver as ReturnType<typeof vi.fn>).mockImplementation((config: { onDestroyed?: () => void }) => {
        destroyCallback = config.onDestroyed;
        return { drive: mockDrive, destroy: vi.fn(), moveNext: vi.fn() };
      });

      mockRouterNavigation(router);

      await service.startTour(consoleTourId, mockUserId);
      destroyCallback?.();

      service.resetTour(consoleTourId, mockUserId);

      await service.startTour(consoleTourId, mockUserId);

      expect(mockDrive).toHaveBeenCalledTimes(2);
    });

    it('should run console and admin tours independently for the same user', async () => {
      const { driver } = await import('driver.js');
      const mockDrive = vi.fn();
      let destroyCallback: (() => void) | undefined;

      (driver as ReturnType<typeof vi.fn>).mockImplementation((config: { onDestroyed?: () => void }) => {
        destroyCallback = config.onDestroyed;
        return { drive: mockDrive, destroy: vi.fn(), moveNext: vi.fn() };
      });

      mockRouterNavigation(router);

      await service.startTour(consoleTourId, mockUserId);
      destroyCallback?.();

      await service.startTour(adminTourId, mockUserId);
      destroyCallback?.();

      expect(mockDrive).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasStartedFor()', () => {
    it('should return false before any startTour call', () => {
      expect(service.hasStartedFor(consoleTourId, mockUserId)).toBe(false);
    });

    it('should return true after startTour is called', async () => {
      mockRouterNavigation(router);
      await service.startTour(consoleTourId, mockUserId);
      expect(service.hasStartedFor(consoleTourId, mockUserId)).toBe(true);
    });

    it('should be reset after resetTour is called', async () => {
      mockRouterNavigation(router);
      await service.startTour(consoleTourId, mockUserId);
      service.resetTour(consoleTourId, mockUserId);
      expect(service.hasStartedFor(consoleTourId, mockUserId)).toBe(false);
    });

    it('should be scoped per user', async () => {
      mockRouterNavigation(router);
      await service.startTour(consoleTourId, 'user-A');
      expect(service.hasStartedFor(consoleTourId, 'user-B')).toBe(false);
    });

    it('should be scoped per tour — console started does not affect admin', async () => {
      mockRouterNavigation(router);
      await service.startTour(consoleTourId, mockUserId);
      expect(service.hasStartedFor(adminTourId, mockUserId)).toBe(false);
    });
  });
});
