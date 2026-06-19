import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { EmbedModeService } from '@guiders-frontend/embed';
import { App } from './app';

describe('App (Story 3.2 embed mode)', () => {
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

  it('debe crear componente (standalone mode por defecto)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.isEmbedMode()).toBe(false);
  });

  it('debe detectar embed mode cuando window.self !== window.top', () => {
    // Override the document.defaultView to simulate iframe
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

  it('debe inyectar EmbedModeService', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    // If the service is not injected, the component creation would fail.
    // This test confirms the service is available.
    expect(fixture.componentInstance).toBeTruthy();
  });
});