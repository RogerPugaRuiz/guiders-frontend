import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ThemeService } from './theme.service';
import { WhiteLabelConfig, WHITE_LABEL_DEFAULTS } from './theme.types';

describe('ThemeService', () => {
  let service: ThemeService;
  let httpMock: HttpTestingController;

  const mockConfig: WhiteLabelConfig = {
    id: '1',
    siteId: 'site-1',
    companyId: 'company-1',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      background: '#ffffff',
      surface: '#f0f0f0',
      text: '#000000',
      textMuted: '#666666'
    },
    branding: {
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
      brandName: 'Test Brand'
    },
    typography: {
      fontFamily: 'Roboto'
    },
    theme: 'light'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ThemeService);
    httpMock = TestBed.inject(HttpTestingController);
    service.setBaseUrl('http://localhost:3000/api');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(service.config()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.initialized()).toBe(false);
  });

  it('should load and apply theme from backend', () => {
    service.loadAndApplyTheme('company-1').subscribe(config => {
      expect(config).toEqual(mockConfig);
      expect(service.config()).toEqual(mockConfig);
      expect(service.initialized()).toBe(true);
      expect(service.loading()).toBe(false);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v2/companies/company-1/white-label');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('should apply defaults on error', () => {
    service.loadAndApplyTheme('company-1').subscribe(config => {
      expect(config.colors).toEqual(WHITE_LABEL_DEFAULTS.colors);
      expect(service.initialized()).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v2/companies/company-1/white-label');
    req.error(new ErrorEvent('Network error'));
  });

  it('should apply theme to document', () => {
    service.applyTheme(mockConfig);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--wl-color-primary')).toBe('#ff0000');
    expect(root.style.getPropertyValue('--wl-color-secondary')).toBe('#00ff00');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('should compute brandName correctly', () => {
    expect(service.brandName()).toBe('Guiders');

    service.applyTheme(mockConfig);
    expect(service.brandName()).toBe('Guiders'); // Still defaults since _config not set

    service.loadAndApplyTheme('company-1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/v2/companies/company-1/white-label');
    req.flush(mockConfig);

    expect(service.brandName()).toBe('Test Brand');
  });

  it('should apply defaults correctly', () => {
    service.applyDefaults();

    expect(service.config()).not.toBeNull();
    expect(service.config()?.colors).toEqual(WHITE_LABEL_DEFAULTS.colors);
    expect(service.config()?.branding.brandName).toBe('Guiders');
  });
});
