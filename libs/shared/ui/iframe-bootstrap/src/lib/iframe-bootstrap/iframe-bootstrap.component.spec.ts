import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IframeBootstrapComponent, BootstrapState } from './iframe-bootstrap.component';
import type { IframeThemeSummary } from '@guiders-frontend/shared/types/iframe';

const mockTheme: IframeThemeSummary = {
  id: 'test-tenant',
  name: 'Test Tenant',
  config: {
    id: 'test-tenant',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      error: '#ff4444',
      success: '#44ff44',
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      baseFontSize: '14px',
      headingFontWeight: 600,
    },
    logos: {
      header: { url: 'https://example.com/logo.png', height: 48 },
      favicon: { url: 'https://example.com/favicon.ico' },
      emptyState: { url: 'https://example.com/empty.png' },
    },
    enabledSections: ['chat', 'inbox'],
    customCss: '',
    componentMappings: {},
  },
};

describe('IframeBootstrapComponent', () => {
  let fixture: ComponentFixture<IframeBootstrapComponent>;
  let component: IframeBootstrapComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IframeBootstrapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IframeBootstrapComponent);
    component = fixture.componentInstance;
  });

  function setState(state: BootstrapState): void {
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
  }

  describe('initiating state', () => {
    it('should render neutral skeleton with "Cargando panel..."', () => {
      setState({ kind: 'initiating' });
      const text = fixture.nativeElement.querySelector('.guiders-bootstrap__text');
      expect(text?.textContent?.trim()).toBe('Cargando panel...');
    });

    it('should render skeleton blocks in initiating state', () => {
      setState({ kind: 'initiating' });
      const skeletons = fixture.nativeElement.querySelectorAll('lib-skeleton-block');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have aria-label "Cargando panel"', () => {
      setState({ kind: 'initiating' });
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root?.getAttribute('aria-label')).toBe('Cargando panel');
    });
  });

  describe('themed state', () => {
    it('should render branded skeleton with tenant logo', () => {
      setState({ kind: 'themed', theme: mockTheme });
      const logo = fixture.nativeElement.querySelector('.guiders-bootstrap__logo') as HTMLImageElement;
      expect(logo?.src).toBe(mockTheme.config.logos.header.url);
    });

    it('should render "Cargando..." text in themed state', () => {
      setState({ kind: 'themed', theme: mockTheme });
      const text = fixture.nativeElement.querySelector('.guiders-bootstrap__text');
      expect(text?.textContent?.trim()).toBe('Cargando...');
    });

    it('should apply CSS variables to host element when themed', () => {
      setState({ kind: 'themed', theme: mockTheme });
      const host = fixture.nativeElement;
      expect(host.style.getPropertyValue('--guiders-color-primary')).toBe(mockTheme.config.colors.primary);
      expect(host.style.getPropertyValue('--guiders-color-background')).toBe(mockTheme.config.colors.background);
      expect(host.style.getPropertyValue('--guiders-color-text-primary')).toBe(mockTheme.config.colors.textPrimary);
      expect(host.style.getPropertyValue('--guiders-font-family')).toBe(mockTheme.config.typography.fontFamily);
    });

    it('should apply CSS variables reactively on transition from initiating to themed', () => {
      setState({ kind: 'initiating' });
      expect(fixture.nativeElement.style.getPropertyValue('--guiders-color-primary')).toBe('');
      setState({ kind: 'themed', theme: mockTheme });
      expect(fixture.nativeElement.style.getPropertyValue('--guiders-color-primary')).toBe(mockTheme.config.colors.primary);
    });

    it('should clear CSS variables when leaving themed state', () => {
      setState({ kind: 'themed', theme: mockTheme });
      expect(fixture.nativeElement.style.getPropertyValue('--guiders-color-primary')).toBe(mockTheme.config.colors.primary);
      setState({ kind: 'error', code: 'network', retryable: true });
      expect(fixture.nativeElement.style.getPropertyValue('--guiders-color-primary')).toBe('');
    });

    it('should use theme.name as logo alt', () => {
      setState({ kind: 'themed', theme: mockTheme });
      const logo = fixture.nativeElement.querySelector('.guiders-bootstrap__logo');
      expect(logo?.getAttribute('alt')).toBe('Test Tenant logo');
    });

    it('should have aria-label with tenant name in themed state', () => {
      setState({ kind: 'themed', theme: mockTheme });
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root?.getAttribute('aria-label')).toBe('Cargando panel de Test Tenant');
    });
  });

  describe('ready state', () => {
    it('should render nothing when state is ready (strict AC #6)', () => {
      setState({ kind: 'ready' });
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root).toBeFalsy();
    });
  });

  describe('error state', () => {
    it('should show "Error de autenticación" for auth code', () => {
      setState({ kind: 'error', code: 'auth', retryable: false });
      const title = fixture.nativeElement.querySelector('.guiders-bootstrap__error-title');
      expect(title?.textContent?.trim()).toBe('Error de autenticación');
    });

    it('should show "Error de conexión" for network code', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const title = fixture.nativeElement.querySelector('.guiders-bootstrap__error-title');
      expect(title?.textContent?.trim()).toBe('Error de conexión');
    });

    it('should show "La carga está tardando demasiado" for timeout code', () => {
      setState({ kind: 'error', code: 'timeout', retryable: true });
      const title = fixture.nativeElement.querySelector('.guiders-bootstrap__error-title');
      expect(title?.textContent?.trim()).toBe('La carga está tardando demasiado');
    });

    it('should show "Versión incompatible" for protocol code', () => {
      setState({ kind: 'error', code: 'protocol', retryable: false });
      const title = fixture.nativeElement.querySelector('.guiders-bootstrap__error-title');
      expect(title?.textContent?.trim()).toBe('Versión incompatible');
    });

    it('should show retry button when retryable is true', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const button = fixture.nativeElement.querySelector('guiders-button-secondary button');
      expect(button).toBeTruthy();
    });

    it('should show login link when retryable is false', () => {
      setState({ kind: 'error', code: 'auth', retryable: false });
      const link = fixture.nativeElement.querySelector('.guiders-bootstrap__login-link');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('https://leadcars.com/login');
    });

    it('should not show login link when retryable is true', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const link = fixture.nativeElement.querySelector('.guiders-bootstrap__login-link');
      expect(link).toBeFalsy();
    });

    it('should emit retry when inner retry button is clicked', () => {
      let retryEmitted = false;
      component.retry.subscribe(() => { retryEmitted = true; });
      setState({ kind: 'error', code: 'network', retryable: true });
      const button = fixture.nativeElement.querySelector('guiders-button-secondary button') as HTMLButtonElement;
      button?.click();
      expect(retryEmitted).toBe(true);
    });

    it('should have role="alert" on error container', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const errorDiv = fixture.nativeElement.querySelector('.guiders-bootstrap__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="assertive" on root when error', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label on retry button', () => {
      setState({ kind: 'error', code: 'network', retryable: true });
      const button = fixture.nativeElement.querySelector('guiders-button-secondary button');
      expect(button?.getAttribute('aria-label')).toBe('Reintentar carga del panel');
    });

    it('should use custom loginUrl input when provided', () => {
      fixture.componentRef.setInput('loginUrl', 'https://custom.example.com/login');
      setState({ kind: 'error', code: 'auth', retryable: false });
      const link = fixture.nativeElement.querySelector('.guiders-bootstrap__login-link');
      expect(link?.getAttribute('href')).toBe('https://custom.example.com/login');
    });
  });

  describe('timeout-warning state', () => {
    it('should show spinner and warning text', () => {
      setState({ kind: 'timeout-warning', elapsed: 6000 });
      const warning = fixture.nativeElement.querySelector('.guiders-bootstrap__warning');
      const text = fixture.nativeElement.querySelector('.guiders-bootstrap__text');
      expect(warning).toBeTruthy();
      expect(text?.textContent?.trim()).toBe('Tardando más de lo esperado...');
    });

    it('should show loading icon', () => {
      setState({ kind: 'timeout-warning', elapsed: 6000 });
      const icon = fixture.nativeElement.querySelector('guiders-icon');
      expect(icon).toBeTruthy();
    });

    it('should have aria-label "Carga tardando más de lo esperado"', () => {
      setState({ kind: 'timeout-warning', elapsed: 6000 });
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root?.getAttribute('aria-label')).toBe('Carga tardando más de lo esperado');
    });
  });

  describe('timing (AC #10, #12)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should remain initiating before 5s', () => {
      setState({ kind: 'initiating' });
      vi.advanceTimersByTime(4900);
      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('.guiders-bootstrap__text');
      expect(text?.textContent?.trim()).toBe('Cargando panel...');
    });

    it('should transition to timeout-warning at 5s', () => {
      setState({ kind: 'initiating' });
      vi.advanceTimersByTime(5000);
      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('.guiders-bootstrap__text');
      expect(text?.textContent?.trim()).toBe('Tardando más de lo esperado...');
    });

    it('should transition to error:timeout at 12s and emit timeout output', () => {
      let timeoutEmitted = false;
      component.timeout.subscribe(() => { timeoutEmitted = true; });
      setState({ kind: 'initiating' });
      vi.advanceTimersByTime(12000);
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.guiders-bootstrap__error-title');
      expect(title?.textContent?.trim()).toBe('La carga está tardando demasiado');
      expect(timeoutEmitted).toBe(true);
    });

    it('should not start timer when initial state is themed', () => {
      setState({ kind: 'themed', theme: mockTheme });
      vi.advanceTimersByTime(13000);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('.guiders-bootstrap');
      expect(root).toBeTruthy();
    });

    it('should clear timer on destroy', () => {
      setState({ kind: 'initiating' });
      fixture.destroy();
      vi.advanceTimersByTime(12000);
    });
  });
});
