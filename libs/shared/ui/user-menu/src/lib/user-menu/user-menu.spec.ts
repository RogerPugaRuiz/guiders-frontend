import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { UserMenu } from './user-menu';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

describe('UserMenu', () => {
  let component: UserMenu;
  let fixture: ComponentFixture<UserMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ENVIRONMENT_TOKEN,
          useValue: {
            api: {
              baseUrl: 'http://localhost:3000',
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenu);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userEmail', 'test@example.com');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- showTourButton ---

  describe('showTourButton input', () => {
    it('should default to false', () => {
      expect(component.showTourButton()).toBe(false);
    });

    it('should not render the tour button when showTourButton is false', () => {
      fixture.componentRef.setInput('showTourButton', false);
      // Open the dropdown to check its contents
      component.isDropdownOpen.set(true);
      fixture.detectChanges();
      const tourBtn = fixture.nativeElement.querySelector(
        '[data-testid="tour-button"]'
      );
      expect(tourBtn).toBeNull();
    });

    it('should render the tour button when showTourButton is true', () => {
      fixture.componentRef.setInput('showTourButton', true);
      component.isDropdownOpen.set(true);
      fixture.detectChanges();
      const tourBtn = fixture.nativeElement.querySelector(
        '[data-testid="tour-button"]'
      );
      expect(tourBtn).not.toBeNull();
    });
  });

  // --- startTour output ---

  describe('startTour output', () => {
    it('should emit startTour when onStartTour() is called', () => {
      const emitSpy = vi.fn();
      component.startTour.subscribe(emitSpy);
      component.onStartTour();
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should close the dropdown when onStartTour() is called', () => {
      component.isDropdownOpen.set(true);
      component.onStartTour();
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should emit startTour when tour button is clicked', () => {
      fixture.componentRef.setInput('showTourButton', true);
      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.startTour.subscribe(emitSpy);

      const tourBtn = fixture.nativeElement.querySelector(
        '[data-testid="tour-button"]'
      );
      tourBtn?.click();

      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });
});
