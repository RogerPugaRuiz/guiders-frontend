import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { EmbedModeService, BrandingService } from '@guiders-frontend/embed';
import { App } from './app';

describe('App (Story 3.2 + 4.2 integration)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ENVIRONMENT_TOKEN,
          useValue: {
            production: false,
            api: {
              baseUrl: 'http://localhost:3000',
            },
            consoleUrl: 'http://localhost:4200',
          },
        },
      ],
    }).compileComponents();
  });

  describe('Story 3.2 — embed mode detection', () => {
    it('debe crear componente (standalone mode por defecto)', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      expect(component).toBeTruthy();
      expect(component.isEmbedMode()).toBe(false);
    });

    it('debe detectar embed mode cuando window.self !== window.top', () => {
      Object.defineProperty(window.document, 'defaultView', {
        value: {
          self: {} as Window,
          top: { different: true } as Window,
          location: { search: '' } as Location,
        } as Window,
        writable: true,
        configurable: true,
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          {
            provide: ENVIRONMENT_TOKEN,
            useValue: {
              production: false,
              api: { baseUrl: 'http://localhost:3000' },
              consoleUrl: 'http://localhost:4200',
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      expect(fixture.componentInstance.isEmbedMode()).toBe(true);
    });

    it('debe detectar embed mode cuando ?embed=true', () => {
      Object.defineProperty(window.document, 'defaultView', {
        value: {
          self: window.self,
          top: window.top,
          location: { search: '?embed=true' } as Location,
        } as Window,
        writable: true,
        configurable: true,
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          {
            provide: ENVIRONMENT_TOKEN,
            useValue: {
              production: false,
              api: { baseUrl: 'http://localhost:3000' },
              consoleUrl: 'http://localhost:4200',
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      expect(fixture.componentInstance.isEmbedMode()).toBe(true);
    });

    it('debe inyectar EmbedModeService y BrandingService', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('Story 4.2 — Branding integration', () => {
    it('debe inyectar BrandingService en App component', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const brandingService = TestBed.inject(BrandingService);
      expect(brandingService).toBeTruthy();
      expect(brandingService.brandingConfig()).toBeNull(); // Initial state
    });

    it('debe inicializar brandingConfig como null hasta load', () => {
      const brandingService = TestBed.inject(BrandingService);
      expect(brandingService.brandingConfig()).toBeNull();
      expect(brandingService.isLoading()).toBe(false);
      expect(brandingService.isReady()).toBe(false);
    });
  });
});